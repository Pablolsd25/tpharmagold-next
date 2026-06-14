// ============================================================
// sync-product-order-from-wix.ts
// Sincroniza el orden de productos con la tienda Wix oficial:
//   - products.sort_order ← orden del catálogo (products/query)
//   - product_categories.sort_order ← orden por colección Wix
//
// Uso: npm run sync:product-order
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { loadEnvLocal } from './load-env-local'
import { MUJERES_PRODUCT_SLUGS } from '../src/lib/tpharma-home'
import { resolveCategorySlug, WIX_OFFER_COLLECTIONS } from './wix-migration-config'

loadEnvLocal()

const WIX_API_KEY = process.env.WIX_API_KEY!
const WIX_SITE_ID = process.env.WIX_SITE_ID!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!WIX_API_KEY || !WIX_SITE_ID || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Faltan variables en .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const wixHeaders: Record<string, string> = {
  Authorization: WIX_API_KEY,
  'wix-site-id': WIX_SITE_ID,
  'Content-Type': 'application/json',
}
if (process.env.WIX_ACCOUNT_ID) wixHeaders['wix-account-id'] = process.env.WIX_ACCOUNT_ID

async function fetchWixProductIds(options?: { collectionId?: string }): Promise<string[]> {
  const ids: string[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const query: Record<string, unknown> = { paging: { limit, offset } }
    if (options?.collectionId) {
      query.filter = JSON.stringify({
        'collections.id': { $hasSome: [options.collectionId] },
      })
    }

    const res = await fetch('https://www.wixapis.com/stores-reader/v1/products/query', {
      method: 'POST',
      headers: wixHeaders,
      body: JSON.stringify({ includeHiddenProducts: true, query }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.warn(`  ⚠️  products/query: ${res.status} ${err.slice(0, 200)}`)
      break
    }

    const data = (await res.json()) as { products?: Array<{ id: string }> }
    const batch = data.products ?? []
    if (batch.length === 0) break

    for (const p of batch) ids.push(p.id)
    if (batch.length < limit) break
    offset += limit
  }

  return ids
}

async function main() {
  console.log('🔄 Sincronizando orden de productos desde Wix...\n')

  const colRes = await fetch('https://www.wixapis.com/stores-reader/v1/collections/query', {
    method: 'POST',
    headers: wixHeaders,
    body: JSON.stringify({ query: { paging: { limit: 100 } } }),
  })
  const colData = (await colRes.json()) as { collections: Array<{ id: string; name: string }> }

  const slugToCatId = new Map<string, string>()
  const wixCollBySlug = new Map<string, string>()

  for (const col of colData.collections ?? []) {
    if (col.name === 'All Products') continue
    const nameLower = col.name.toLowerCase()
    if (WIX_OFFER_COLLECTIONS.has(nameLower)) continue

    const slug = resolveCategorySlug(col.name)
    if (!slug) continue

    const { data: cat } = await supabase.from('categories').select('id').eq('slug', slug).maybeSingle()
    if (!cat) continue

    slugToCatId.set(slug, cat.id)
    wixCollBySlug.set(slug, col.id)
  }

  const { data: dbProducts } = await supabase.from('products').select('id, slug, wix_id')
  const wixToDb = new Map(
    (dbProducts ?? []).filter((p) => p.wix_id).map((p) => [p.wix_id as string, p.id as string]),
  )

  // 1. Orden global = catálogo completo Wix (misma secuencia que la tienda)
  console.log('📦 Catálogo completo (All Products)...')
  const catalogWixIds = await fetchWixProductIds()
  let globalUpdated = 0
  for (let i = 0; i < catalogWixIds.length; i++) {
    const dbId = wixToDb.get(catalogWixIds[i])
    if (!dbId) continue
    const { error } = await supabase.from('products').update({ sort_order: i }).eq('id', dbId)
    if (!error) globalUpdated++
  }
  console.log(`  ✅ ${globalUpdated} productos (${catalogWixIds.length} en Wix)\n`)

  // 2. Orden por categoría
  console.log('📂 Orden por categoría...')
  let categoryLinks = 0

  for (const [slug, wixCollId] of wixCollBySlug) {
    const catId = slugToCatId.get(slug)
    if (!catId) continue

    const orderedWixIds = await fetchWixProductIds({ collectionId: wixCollId })
    for (let i = 0; i < orderedWixIds.length; i++) {
      const dbId = wixToDb.get(orderedWixIds[i])
      if (!dbId) continue

      const { error } = await supabase.from('product_categories').upsert(
        { product_id: dbId, category_id: catId, sort_order: i },
        { onConflict: 'product_id,category_id' },
      )
      if (error) {
        if (categoryLinks === 0 && i === 0) {
          console.error(`  ❌ ${slug}: ${error.message}`)
          console.error('     Ejecuta supabase/migrations/20260610_product_categories_sort_order.sql en Supabase')
        }
      } else {
        categoryLinks++
      }
    }
    console.log(`  ✅ ${slug}: ${orderedWixIds.length} productos`)
  }

  // 3. Sección mujeres (home Wix)
  const mujeresCatId = slugToCatId.get('mujeres')
  if (mujeresCatId) {
    let mujeresCount = 0
    for (let i = 0; i < MUJERES_PRODUCT_SLUGS.length; i++) {
      const row = (dbProducts ?? []).find((p) => p.slug === MUJERES_PRODUCT_SLUGS[i])
      if (!row) continue
      await supabase.from('product_categories').upsert(
        { product_id: row.id, category_id: mujeresCatId, sort_order: i },
        { onConflict: 'product_id,category_id' },
      )
      mujeresCount++
    }
    console.log(`  ✅ mujeres (home): ${mujeresCount} productos`)
  }

  console.log(`\nListo. ${categoryLinks} vínculos con sort_order por categoría.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
