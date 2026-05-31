// ============================================================
// backfill-order-items-wix.ts
// Rellena name, product_image y product_id en la tabla order_items
// consultando los lineItems originales de cada orden en Wix.
//
// Estrategia por orden:
//   1. Leer openpay_transaction_id = "wix_<wix_order_id>"
//   2. Traer la orden de Wix → lineItems
//   3. DELETE order_items WHERE order_id = ... (solo las de origen Wix)
//   4. INSERT order_items con name, product_image, product_id, quantity, unit_price
//
// Las órdenes nativas (sin prefijo "wix_") se saltan sin tocar.
//
// Uso:
//   npm run backfill:order-items               (ejecuta)
//   npm run backfill:order-items -- --dry-run  (solo muestra conteo, no escribe)
//   npm run backfill:order-items -- --limit 10 (solo procesa las primeras 10 órdenes)
// ============================================================

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// ─── Cargar .env.local ───────────────────────────────────────
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const [key, ...vals] = line.split('=')
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
  }
}

const DRY_RUN       = process.argv.includes('--dry-run')
const WIX_API_KEY   = process.env.WIX_API_KEY!
const WIX_SITE_ID   = process.env.WIX_SITE_ID   ?? '0c8e6806-c437-4a19-914b-39f9ed9284c6'
const WIX_ACCOUNT_ID = process.env.WIX_ACCOUNT_ID ?? ''
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

const limitArg = process.argv.find(a => a.startsWith('--limit='))
const LIMIT     = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity

if (!WIX_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Faltan variables de entorno. Revisa .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const WIX_HEADERS: Record<string, string> = {
  'Content-Type':  'application/json',
  'Authorization': WIX_API_KEY,
  'wix-site-id':   WIX_SITE_ID,
}
if (WIX_ACCOUNT_ID) WIX_HEADERS['wix-account-id'] = WIX_ACCOUNT_ID

// ─── Helpers ─────────────────────────────────────────────────

// Throttle: max N concurrentes a la vez
async function mapConcurrent<T, R>(
  items:   T[],
  limit:   number,
  fn:      (item: T, i: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit)
    const batchResults = await Promise.all(batch.map((item, j) => fn(item, i + j)))
    results.push(...batchResults)
  }
  return results
}

async function fetchWixOrder(wixOrderId: string): Promise<WixOrder | null> {
  try {
    const res = await fetch(`https://www.wixapis.com/stores/v2/orders/${wixOrderId}`, {
      headers: WIX_HEADERS,
    })
    if (!res.ok) {
      if (res.status === 404) return null
      console.warn(`  ⚠️  HTTP ${res.status} para orden Wix ${wixOrderId}`)
      return null
    }
    const j = await res.json() as { order: WixOrder }
    return j.order ?? null
  } catch (err) {
    console.warn(`  ⚠️  Error de red para orden ${wixOrderId}:`, err)
    return null
  }
}

// ─── Caché de wix_id → SB product_id ─────────────────────────
let wixToSbProduct: Map<string, string> | null = null

async function getProductMap(): Promise<Map<string, string>> {
  if (wixToSbProduct) return wixToSbProduct
  const { data } = await supabase.from('products').select('id, wix_id').not('wix_id', 'is', null)
  wixToSbProduct = new Map((data ?? []).map(p => [p.wix_id, p.id]))
  return wixToSbProduct
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚀 Backfill order_items desde Wix${DRY_RUN ? ' (DRY RUN)' : ''}`)
  if (LIMIT !== Infinity) console.log(`   Límite: ${LIMIT} órdenes`)
  console.log()

  // 1. Obtener todas las órdenes SB que vienen de Wix (paginado a 1000/página)
  const allOrders: { id: string; openpay_transaction_id: string; wix_order_number: number; customer_name: string }[] = []
  let page = 0
  const PAGE_SIZE = 1000
  while (true) {
    const { data, error: ordErr } = await supabase
      .from('orders')
      .select('id, openpay_transaction_id, wix_order_number, customer_name')
      .like('openpay_transaction_id', 'wix_%')
      .order('created_at', { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (ordErr) {
      console.error('❌ Error obteniendo órdenes:', ordErr.message)
      process.exit(1)
    }
    if (!data || data.length === 0) break
    allOrders.push(...data)
    if (data.length < PAGE_SIZE) break
    page++
  }

  const orders = LIMIT !== Infinity ? allOrders.slice(0, LIMIT) : allOrders
  console.log(`📋 Órdenes Wix en SB: ${allOrders.length} | A procesar: ${orders.length}\n`)

  // 2. Obtener caché de productos
  const productMap = await getProductMap()
  console.log(`🗂️  Productos en caché: ${productMap.size}\n`)

  // 3. Procesar en lotes de 5 (throttle API de Wix)
  const BATCH = 5
  let processed   = 0
  let skipped     = 0
  let wixNotFound = 0
  let totalItems  = 0
  let errors      = 0

  process.stdout.write('Progreso: ')

  await mapConcurrent(orders, BATCH, async (order, idx) => {
    const wixId = order.openpay_transaction_id.replace(/^wix_/, '')

    // Traer orden de Wix
    const wixOrder = await fetchWixOrder(wixId)
    if (!wixOrder) {
      wixNotFound++
      return
    }

    const lineItems = wixOrder.lineItems ?? []
    if (lineItems.length === 0) {
      skipped++
      return
    }

    if (DRY_RUN) {
      totalItems += lineItems.length
      processed++
      if ((idx + 1) % 100 === 0) process.stdout.write(`${idx + 1}..`)
      return
    }

    // Construir rows para insertar
    const rows = lineItems.map(li => {
      const wixProductId = li.productId ?? null
      const sbProductId  = wixProductId ? (productMap.get(wixProductId) ?? null) : null

      // URL de imagen: preferir mediaItem.url, fallback a null
      let imgUrl: string | null = li.mediaItem?.url ?? null
      if (imgUrl && imgUrl.startsWith('wix:image://')) {
        const fileId = imgUrl.replace('wix:image://v1/', '').split('/')[0].split('#')[0]
        imgUrl = `https://static.wixstatic.com/media/${fileId}`
      }

      return {
        order_id:      order.id,
        product_id:    sbProductId,
        quantity:      li.quantity ?? 1,
        unit_price:    parseFloat(String(li.price ?? 0)),
        name:          li.name ?? null,
        product_image: imgUrl,
      }
    })

    // Borrar items existentes de esta orden
    const { error: delErr } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', order.id)

    if (delErr) {
      console.error(`\n  ❌ Error borrando items de orden ${order.wix_order_number}:`, delErr.message)
      errors++
      return
    }

    // Insertar nuevos items
    const { error: insErr } = await supabase
      .from('order_items')
      .insert(rows)

    if (insErr) {
      console.error(`\n  ❌ Error insertando items de orden ${order.wix_order_number}:`, insErr.message)
      errors++
      return
    }

    totalItems += rows.length
    processed++

    if ((idx + 1) % 50 === 0) process.stdout.write(`${idx + 1}..`)
  })

  console.log(` ✅ ${processed}/${orders.length}`)

  // 4. Resumen
  console.log('\n📊 Resumen:')
  console.log(`   Órdenes procesadas: ${processed}`)
  console.log(`   Órdenes saltadas (sin items): ${skipped}`)
  console.log(`   Órdenes no encontradas en Wix: ${wixNotFound}`)
  console.log(`   Errores: ${errors}`)
  console.log(`   Total order_items ${DRY_RUN ? 'a insertar' : 'insertados'}: ${totalItems}`)

  // 5. Verificación rápida (post-backfill)
  if (!DRY_RUN) {
    const { count: total } = await supabase.from('order_items').select('*', { count: 'exact', head: true })
    const { count: nullName } = await supabase.from('order_items').select('*', { count: 'exact', head: true }).is('name', null)
    const { count: nullImg } = await supabase.from('order_items').select('*', { count: 'exact', head: true }).is('product_image', null)
    const { count: withPid } = await supabase.from('order_items').select('*', { count: 'exact', head: true }).not('product_id', 'is', null)
    console.log('\n🔍 Estado final order_items:')
    console.log(`   Total:           ${total}`)
    console.log(`   Con name:        ${(total ?? 0) - (nullName ?? 0)}`)
    console.log(`   Con img:         ${(total ?? 0) - (nullImg ?? 0)}`)
    console.log(`   Con product_id:  ${withPid}`)
    console.log(`   Sin name (NULL): ${nullName}`)
  }

  console.log('\n✅ Backfill completo.')
}

main().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})

// ─── Tipos ───────────────────────────────────────────────────

interface WixMediaItem {
  url?:       string
  mediaType?: string
}

interface WixLineItem {
  index?:     number
  quantity?:  number
  price?:     string | number
  name?:      string
  productId?: string
  mediaItem?: WixMediaItem
}

interface WixOrder {
  id:        string
  lineItems?: WixLineItem[]
}
