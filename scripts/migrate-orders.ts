/**
 * scripts/migrate-orders.ts
 *
 * Fetches all orders from Wix Orders API and inserts them into
 * Supabase (orders + order_items tables).
 *
 * Idempotent: skips orders whose openpay_transaction_id = "wix_<wixOrderId>"
 * already exists in Supabase.
 *
 * Usage:
 *   npx ts-node -P tsconfig.scripts.json scripts/migrate-orders.ts
 *   or: npm run migrate:orders
 *
 * Env vars needed:
 *   WIX_API_KEY
 *   WIX_ACCOUNT_ID
 *   WIX_SITE_ID
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const WIX_ORDERS_API = 'https://www.wixapis.com/ecom/v1/orders'
const HEADERS = {
  'Content-Type':   'application/json',
  'Authorization':  process.env.WIX_API_KEY ?? '',
  'wix-account-id': process.env.WIX_ACCOUNT_ID ?? '',
  'wix-site-id':    process.env.WIX_SITE_ID ?? '',
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

interface WixLineItem {
  id:           string
  productName:  { original: string }
  quantity:     number
  price:        { amount: string }
  catalogReference?: { catalogItemId: string }
}

interface WixOrder {
  id:           string
  number:       number
  createdDate:  string
  status:       string
  priceSummary: {
    subtotal: { amount: string }
    total:    { amount: string }
    shipping: { amount: string }
  }
  billingInfo?: {
    contactDetails?: {
      firstName?: string
      lastName?:  string
      email?:     string
      phone?:     string
    }
  }
  shippingInfo?: {
    logistics?: {
      shippingDestination?: {
        address?: {
          addressLine?: string
          city?:        string
          postalCode?:  string
          subdivision?: string
          country?:     string
        }
        contactDetails?: { fullName?: string; phone?: string }
      }
    }
  }
  lineItems: WixLineItem[]
  paymentStatus: string
}

function wixStatusToSupabase(status: string, paymentStatus: string): string {
  if (paymentStatus === 'PAID') {
    if (status === 'FULFILLED') return 'delivered'
    if (status === 'PARTIALLY_FULFILLED') return 'shipped'
    return 'paid'
  }
  if (status === 'CANCELED') return 'cancelled'
  return 'pending'
}

async function fetchAllWixOrders(): Promise<WixOrder[]> {
  const all: WixOrder[] = []
  let cursor = ''

  do {
    const body: Record<string, unknown> = { paging: { limit: 100 } }
    if (cursor) (body as Record<string, unknown>).cursorPaging = { cursor }

    const res = await fetch(`${WIX_ORDERS_API}/search`, {
      method:  'POST',
      headers: HEADERS,
      body:    JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Wix orders fetch failed: ${res.status} — ${err}`)
    }

    const json = await res.json() as {
      orders:   WixOrder[]
      metadata?: { cursors?: { next?: string }; hasNext?: boolean }
    }
    all.push(...(json.orders ?? []))
    cursor = json.metadata?.hasNext ? (json.metadata.cursors?.next ?? '') : ''
  } while (cursor)

  return all
}

async function fetchSupabaseProducts(): Promise<Map<string, string>> {
  /** Returns: wixProductId → supabase product UUID  (stored in products.wix_id if exists, else match by name) */
  const { data } = await supabase.from('products').select('id, name, wix_id')
  const map = new Map<string, string>()
  for (const p of data ?? []) {
    if (p.wix_id) map.set(p.wix_id, p.id)
  }
  return map
}

async function main() {
  console.log('🔄  Fetching Wix orders...')
  const wixOrders = await fetchAllWixOrders()
  console.log(`   Found ${wixOrders.length} Wix orders.`)

  // Build set of already-migrated wix order IDs
  const { data: existingOrders } = await supabase
    .from('orders')
    .select('openpay_transaction_id')
    .like('openpay_transaction_id', 'wix_%')

  const migratedIds = new Set(
    (existingOrders ?? []).map((o) => o.openpay_transaction_id)
  )

  const productMap = await fetchSupabaseProducts()

  let inserted = 0
  let skipped  = 0
  let errors   = 0

  for (const wo of wixOrders) {
    const wixRef = `wix_${wo.id}`

    if (migratedIds.has(wixRef)) {
      skipped++
      continue
    }

    const contact = wo.billingInfo?.contactDetails
    const dest    = wo.shippingInfo?.logistics?.shippingDestination
    const addr    = dest?.address

    const subtotal     = parseFloat(wo.priceSummary.subtotal.amount)
    const shippingCost = parseFloat(wo.priceSummary.shipping.amount)
    const total        = parseFloat(wo.priceSummary.total.amount)

    const shippingAddress = addr ? {
      street:     addr.addressLine ?? '',
      city:       addr.city ?? '',
      state:      addr.subdivision ?? '',
      postalCode: addr.postalCode ?? '',
      country:    addr.country ?? 'MX',
      phone:      dest?.contactDetails?.phone ?? contact?.phone ?? '',
    } : null

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        profile_id:             null,
        status:                 wixStatusToSupabase(wo.status, wo.paymentStatus),
        subtotal,
        shipping_cost:          shippingCost,
        total,
        openpay_transaction_id: wixRef,
        shipping_address:       shippingAddress,
        customer_email:         contact?.email ?? null,
        created_at:             wo.createdDate,
      })
      .select('id')
      .single()

    if (orderErr || !order) {
      console.error(`  ✗  Order ${wo.number} (${wo.id}): ${orderErr?.message}`)
      errors++
      continue
    }

    // Insert line items
    const items = wo.lineItems.map((li) => ({
      order_id:   order.id,
      product_id: productMap.get(li.catalogReference?.catalogItemId ?? '') ?? null,
      quantity:   li.quantity,
      unit_price: parseFloat(li.price.amount),
    }))

    const { error: itemsErr } = await supabase.from('order_items').insert(items)
    if (itemsErr) {
      console.warn(`  ⚠  Order ${wo.number}: items insert failed — ${itemsErr.message}`)
    }

    console.log(`  ✓  Order #${wo.number} — $${total} MXN (${wixStatusToSupabase(wo.status, wo.paymentStatus)})`)
    inserted++
  }

  console.log(`\n✅  Done. Inserted: ${inserted}  |  Skipped: ${skipped}  |  Errors: ${errors}`)
}

main().catch((err) => {
  console.error('❌  migrate-orders failed:', err)
  process.exit(1)
})
