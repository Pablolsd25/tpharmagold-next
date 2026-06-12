// Vincula productos a categorías Wix usando collectionIds de cada producto
// Uso: npx tsx scripts/sync-product-categories.ts

import { createClient } from '@supabase/supabase-js'
import { loadEnvLocal } from './load-env-local'
import { MUJERES_PRODUCT_SLUGS } from '../src/lib/tpharma-home'
import { resolveCategorySlug, WIX_OFFER_COLLECTIONS } from './wix-migration-config'

loadEnvLocal()

const WIX_API_KEY = process.env.WIX_API_KEY!
const WIX_SITE_ID = process.env.WIX_SITE_ID!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const wixHeaders: Record<string, string> = {
  Authorization: WIX_API_KEY,
  'wix-site-id': WIX_SITE_ID,
  'Content-Type': 'application/json',
}
if (process.env.WIX_ACCOUNT_ID) wixHeaders['wix-account-id'] = process.env.WIX_ACCOUNT_ID

async function main() {
  const colRes = await fetch('https://www.wixapis.com/stores-reader/v1/collections/query', {
    method: 'POST',
    headers: wixHeaders,
    body: JSON.stringify({ query: { paging: { limit: 100 } } }),
  })
  const colData = await colRes.json() as { collections: Array<{ id: string; name: string }> }

  const wixCollToCatId = new Map<string, string>()
  for (const col of colData.collections ?? []) {
    if (col.name === 'All Products') continue
    const nameLower = col.name.toLowerCase()
    if (WIX_OFFER_COLLECTIONS.has(nameLower)) continue
    const slug = resolveCategorySlug(col.name)
    if (!slug) continue

    const { data: existing } = await supabase.from('categories').select('id').eq('slug', slug).maybeSingle()
    if (existing) {
      wixCollToCatId.set(col.id, existing.id)
      continue
    }
    const { data: created } = await supabase.from('categories').insert({ name: col.name, slug }).select('id').single()
    if (created) wixCollToCatId.set(col.id, created.id)
  }

  const { data: dbProducts } = await supabase.from('products').select('id, wix_id, slug')
  const wixToDb = new Map((dbProducts ?? []).filter((p) => p.wix_id).map((p) => [p.wix_id!, p.id]))

  let offset = 0
  let linked = 0
  const premiumOrder: string[] = []
  const hombresOrder: string[] = []

  while (true) {
    const res = await fetch('https://www.wixapis.com/stores-reader/v1/products/query', {
      method: 'POST',
      headers: wixHeaders,
      body: JSON.stringify({ includeHiddenProducts: true, query: { paging: { limit: 100, offset } } }),
    })
    const data = await res.json() as { products: Array<{ id: string; collectionIds?: string[] }> }
    const products = data.products ?? []
    if (products.length === 0) break

    for (const p of products) {
      const dbId = wixToDb.get(p.id)
      if (!dbId) continue

      for (const collId of p.collectionIds ?? []) {
        if (collId === '00000000-000000-000000-000000000001') continue
        const catId = wixCollToCatId.get(collId)
        if (!catId) continue

        await supabase.from('product_categories').upsert(
          { product_id: dbId, category_id: catId },
          { onConflict: 'product_id,category_id' },
        )
        linked++
      }
    }

    offset += products.length
    if (products.length < 100) break
  }

  // Orden premium desde colección Wix PREMIUM
  const premiumColl = [...wixCollToCatId.entries()].find(([, catId]) => {
    return colData.collections?.some((c) => wixCollToCatId.get(c.id) === catId && c.name.toUpperCase() === 'PREMIUM')
  })
  if (premiumColl) {
    const [wixPremiumId] = premiumColl
    const premiumProds = (await fetch('https://www.wixapis.com/stores-reader/v1/products/query', {
      method: 'POST',
      headers: wixHeaders,
      body: JSON.stringify({
        includeHiddenProducts: true,
        query: { filter: JSON.stringify({ 'collections.id': { $hasSome: [wixPremiumId] } }), paging: { limit: 100 } },
      }),
    }).then((r) => r.json())) as { products: Array<{ id: string }> }

    premiumProds.products?.forEach((p, i) => {
      const dbId = wixToDb.get(p.id)
      if (dbId) premiumOrder.push(dbId)
      void supabase.from('products').update({ sort_order: i }).eq('id', dbId!)
    })
  }

  // Mujeres por slugs explícitos
  const { data: mujeresCat } = await supabase.from('categories').select('id').eq('slug', 'mujeres').maybeSingle()
  if (mujeresCat) {
    for (const slug of MUJERES_PRODUCT_SLUGS) {
      const row = (dbProducts ?? []).find((p) => p.slug === slug)
      if (row) {
        await supabase.from('product_categories').upsert(
          { product_id: row.id, category_id: mujeresCat.id },
          { onConflict: 'product_id,category_id' },
        )
      }
    }
  }

  console.log(`✅ Vínculos product_categories: ${linked}`)
  console.log(`✅ Premium ordenados: ${premiumOrder.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
