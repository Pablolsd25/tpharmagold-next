/**
 * Compara catálogo Wix vs Supabase: conteos, faltantes y variantes.
 * Uso: npx tsx scripts/audit-wix-supabase-products.ts
 */
import { createClient } from '@supabase/supabase-js'
import { loadEnvLocal } from './load-env-local'

loadEnvLocal()

const WIX_API_KEY = process.env.WIX_API_KEY!
const WIX_SITE_ID = process.env.WIX_SITE_ID!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!WIX_API_KEY || !WIX_SITE_ID || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Faltan variables en .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const wixHeaders: Record<string, string> = {
  Authorization: WIX_API_KEY,
  'wix-site-id': WIX_SITE_ID,
  'Content-Type': 'application/json',
}
if (process.env.WIX_ACCOUNT_ID) {
  wixHeaders['wix-account-id'] = process.env.WIX_ACCOUNT_ID
}

interface WixProduct {
  id: string
  name: string
  slug: string
  visible?: boolean
  productOptions?: Array<{
    name: string
    choices?: Array<{ value: string }>
  }>
}

async function fetchAllWixProducts(): Promise<WixProduct[]> {
  let all: WixProduct[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const res = await fetch('https://www.wixapis.com/stores-reader/v1/products/query', {
      method: 'POST',
      headers: wixHeaders,
      body: JSON.stringify({
        includeHiddenProducts: true,
        query: { paging: { limit, offset } },
      }),
    })

    if (!res.ok) {
      throw new Error(`Wix API error: ${await res.text()}`)
    }

    const data = (await res.json()) as { products?: WixProduct[] }
    const batch = data.products ?? []
    all = [...all, ...batch]
    if (batch.length < limit) break
    offset += limit
  }

  return all
}

async function main() {
  console.log('\n🔍 Auditoría Wix ↔ Supabase (productos y variantes)\n')

  const wix = await fetchAllWixProducts()
  const { data: sb, error } = await supabase
    .from('products')
    .select('id, name, slug, wix_id, is_active')

  if (error || !sb) {
    console.error('❌ Error leyendo Supabase:', error?.message)
    process.exit(1)
  }

  const sbByWix = new Map(sb.filter((p) => p.wix_id).map((p) => [p.wix_id as string, p]))
  const sbBySlug = new Map(sb.map((p) => [p.slug, p]))
  const sbByName = new Map(sb.map((p) => [p.name.toLowerCase().trim(), p]))

  const missing: WixProduct[] = []
  const withVariants: Array<{ name: string; id: string; detail: string }> = []

  for (const p of wix) {
    const opts = p.productOptions ?? []
    if (opts.length > 0) {
      const detail = opts
        .map((o) => `${o.name}: ${(o.choices ?? []).map((c) => c.value).join(', ')}`)
        .join(' | ')
      withVariants.push({ name: p.name, id: p.id, detail })
    }

    const inSb =
      sbByWix.get(p.id) ??
      sbBySlug.get(p.slug) ??
      sbByName.get(p.name.toLowerCase().trim())

    if (!inSb) missing.push(p)
  }

  const extra = sb.filter((p) => p.wix_id && !wix.some((w) => w.id === p.wix_id))

  const { count: optCount } = await supabase
    .from('product_options')
    .select('*', { count: 'exact', head: true })

  const { data: productsWithOpts } = await supabase
    .from('product_options')
    .select('product_id')

  const uniqueWithOpts = new Set((productsWithOpts ?? []).map((r) => r.product_id)).size

  console.log('=== CONTEOS ===')
  console.log(`Wix productos:                    ${wix.length}`)
  console.log(`Supabase productos:               ${sb.length}`)
  console.log(`Diferencia:                       ${wix.length - sb.length}`)
  console.log(`Wix con variantes (productOptions): ${withVariants.length}`)
  console.log(`Supabase productos con opciones:  ${uniqueWithOpts}`)
  console.log(`Filas en product_options:         ${optCount ?? 0}`)

  console.log(`\n=== FALTAN EN SUPABASE (${missing.length}) ===`)
  if (missing.length === 0) {
    console.log('(ninguno)')
  } else {
    for (const m of missing) {
      console.log(`- ${m.name}`)
      console.log(`  slug: ${m.slug} | wix_id: ${m.id} | visible: ${m.visible !== false}`)
    }
  }

  console.log(`\n=== EN SUPABASE PERO NO EN WIX (${extra.length}) ===`)
  if (extra.length === 0) {
    console.log('(ninguno)')
  } else {
    for (const e of extra) {
      console.log(`- ${e.name} (wix_id: ${e.wix_id})`)
    }
  }

  console.log('\n=== PRODUCTOS CON VARIANTES EN WIX ===')
  for (const v of withVariants) {
    console.log(`- ${v.name} → ${v.detail}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
