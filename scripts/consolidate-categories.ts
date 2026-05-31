// ============================================================
// consolidate-categories.ts
// Consolida las categorías de Supabase con las colecciones reales de Wix.
//
// Qué hace:
//   1. Re-asigna category_id a cada producto según sus collectionIds en Wix
//   2. Asigna GLOW PROTEIN manualmente a Women's nutrition (solo en "All Products")
//   3. Elimina las 3 categorías SB que no existen en Wix:
//        - Nutrición Hombre  (slug: hombres)
//        - Nutrición Mujer   (slug: mujeres)
//        - Ofertas           (slug: ofertas)
//
// Uso:
//   npm run consolidate:categories               (ejecuta)
//   npm run consolidate:categories -- --dry-run  (solo muestra, no escribe)
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

// ─── Mapeos ──────────────────────────────────────────────────

const ALL_PRODUCTS_COLL = '00000000-000000-000000-000000000001'

// Wix collection ID → Supabase category ID (las 8 colecciones reales)
const COLL_TO_CAT: Record<string, string> = {
  '8a8b53df-9c7d-43b3-0738-b26872d1d77a': 'cde9ba69-bb40-49e5-afbd-ee5cca86131c', // Best Sellers
  '323a0c82-f6b2-dd1b-1c4b-6614e738da1c': 'bed625e8-092b-490d-8d88-c3ae9d3b49b2', // Favoritos de ellas
  '8281cb1d-8fa3-9b90-197d-bbe7fe562c89': '2a395d9d-b08f-47f4-89e1-2831613349eb', // Lo Más Vendido
  '184d49b2-b2af-920a-8660-c15003bcab3e': 'fa7a76af-6241-49c2-a849-65eea9a710f1', // Men Nutrition
  'c6079d79-30bd-251b-8c0a-2e5ae2894108': 'fb9ab1ab-c6a4-42d8-b648-19af1525a67b', // Nuestras Ofertas
  'b38c20d2-b7b0-34da-e3f4-3a9c8dfde91a': '2a5777ff-a0a9-4a43-9113-6b7b94a26cd7', // Suplementos
  '0982c35c-11a1-729d-fc9d-09464dcf81b7': 'd69ed673-1f82-4ecf-b250-44d29094482c', // Varones
  'aba03e1f-ec49-bfce-a3ef-91a55f417ea1': 'ce1d4d02-1d13-451a-a163-2acd8e4dceef', // Women's nutrition
}

// Categorías SB a eliminar (no existen en Wix)
const CATS_TO_DELETE = [
  'f9ad5200-e066-4bb8-a6a0-fbcd4f76e630', // Nutrición Hombre
  'db29e43a-4745-4e12-b5dc-c8f504e1a8bb', // Nutrición Mujer
  '12d16010-623e-4459-bfb7-1edf255800cf', // Ofertas
]

// wix_id de GLOW PROTEIN → fallback a Women's nutrition (solo en All Products, invisible)
const GLOW_PROTEIN_WIX_ID = '657af36b-f6fa-d2e1-3a26-da5ae6c3b829'
const WOMENS_NUTRITION_CAT = 'ce1d4d02-1d13-451a-a163-2acd8e4dceef'

function pickCategory(collectionIds: string[]): string | null {
  for (const id of collectionIds) {
    if (id === ALL_PRODUCTS_COLL) continue
    if (COLL_TO_CAT[id]) return COLL_TO_CAT[id]
  }
  return null
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚀 Consolidación de categorías${DRY_RUN ? ' (DRY RUN)' : ''}\n`)

  // 1. Obtener todos los productos SB
  const { data: sbProds, error: sbErr } = await supabase
    .from('products')
    .select('id, name, wix_id, category_id')

  if (sbErr || !sbProds) {
    console.error('❌ Error obteniendo productos de SB:', sbErr?.message)
    process.exit(1)
  }

  // 2. Obtener todos los productos de Wix (incluyendo ocultos)
  const wr = await fetch('https://www.wixapis.com/stores-reader/v1/products/query', {
    method:  'POST',
    headers: WIX_HEADERS,
    body:    JSON.stringify({ includeHiddenProducts: true, query: { paging: { limit: 100 } } }),
  })
  if (!wr.ok) {
    console.error('❌ Error obteniendo productos de Wix:', await wr.text())
    process.exit(1)
  }
  const wj = await wr.json() as { products: WixProduct[] }
  const wixById = new Map(wj.products.map(p => [p.id, p]))

  // 3. Obtener nombres de categorías SB para logging
  const { data: cats } = await supabase.from('categories').select('id, name, slug')
  const catById = new Map((cats ?? []).map(c => [c.id, c]))

  // 4. Re-asignar categorías
  console.log('📋 Reasignando categorías de productos...\n')
  let updated   = 0
  let unchanged = 0
  let noMatch   = 0

  for (const prod of sbProds) {
    let newCatId: string | null = null

    if (prod.wix_id === GLOW_PROTEIN_WIX_ID) {
      // Caso especial: GLOW PROTEIN solo está en "All Products" → Women's nutrition
      newCatId = WOMENS_NUTRITION_CAT
    } else if (prod.wix_id) {
      const wixProd = wixById.get(prod.wix_id)
      if (wixProd) {
        newCatId = pickCategory(wixProd.collectionIds ?? [])
      }
    }

    const currentName = catById.get(prod.category_id ?? '')?.name ?? 'NULL'
    const newName     = catById.get(newCatId ?? '')?.name         ?? 'NULL'

    if (!newCatId) {
      console.warn(`  ⚠️  Sin categoría Wix para: "${prod.name}" (mantiene "${currentName}")`)
      noMatch++
      continue
    }

    if (newCatId === prod.category_id) {
      unchanged++
      continue
    }

    console.log(`  ✏️  "${prod.name}"`)
    console.log(`       ${currentName} → ${newName}`)

    if (!DRY_RUN) {
      const { error } = await supabase
        .from('products')
        .update({ category_id: newCatId })
        .eq('id', prod.id)

      if (error) {
        console.error(`     ❌ Error actualizando:`, error.message)
        continue
      }
    }
    updated++
  }

  console.log(`\n  Actualizados: ${updated} | Sin cambio: ${unchanged} | Sin match: ${noMatch}`)

  // 5. Eliminar categorías extra
  console.log('\n🗑️  Eliminando categorías que no existen en Wix...')
  for (const catId of CATS_TO_DELETE) {
    const cat = catById.get(catId)

    // Verificar que no queden productos asignados a ella
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', catId)

    if ((count ?? 0) > 0) {
      console.warn(`  ⚠️  "${cat?.name}" aún tiene ${count} productos → no se elimina`)
      continue
    }

    console.log(`  🗑️  "${cat?.name}" (${cat?.slug}) → ${DRY_RUN ? '[DRY RUN] se eliminaría' : 'eliminando...'}`)

    if (!DRY_RUN) {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', catId)

      if (error) {
        console.error(`     ❌ Error eliminando categoría:`, error.message)
      } else {
        console.log(`     ✅ Eliminada`)
      }
    }
  }

  // 6. Resumen final
  const { data: finalCats } = await supabase.from('categories').select('id, name, slug')
  const { data: finalProds } = await supabase.from('products').select('category_id, name')

  const catCount: Record<string, number> = {}
  for (const p of finalProds ?? []) {
    const name = (finalCats ?? []).find(c => c.id === p.category_id)?.name ?? 'NULL'
    catCount[name] = (catCount[name] ?? 0) + 1
  }

  console.log(`\n📊 Categorías finales (${finalCats?.length}):`)
  Object.entries(catCount)
    .sort(([, a], [, b]) => b - a)
    .forEach(([name, n]) => console.log(`   ${n.toString().padStart(2)} productos → ${name}`))

  console.log('\n✅ Consolidación completa.')
}

main().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})

// ─── Tipos ───────────────────────────────────────────────────

interface WixProduct {
  id:             string
  collectionIds?: string[]
}
