/**
 * Asigna categoría a productos que solo estaban en "All Products" en Wix.
 * Uso: npx tsx scripts/assign-orphan-categories.ts [--dry-run]
 */
import { createClient } from '@supabase/supabase-js'
import { loadEnvLocal } from './load-env-local'
import { pickPrimaryCategoryId } from '../src/lib/product-categories'

loadEnvLocal()

const DRY_RUN = process.argv.includes('--dry-run')

/** slug de producto → slug de categoría canónica */
const SLUG_TO_CATEGORY: Record<string, string> = {
  // Orales → formulas-rendimiento
  'alphaclen-clembuterol': 'formulas-rendimiento',
  'alphanabol-dianabol': 'formulas-rendimiento',
  'alphanadrol-oximetalona': 'formulas-rendimiento',
  'alphanavar-oxandrolona': 'formulas-rendimiento',
  'alphaturina': 'formulas-rendimiento',
  'alphaviron-proviron': 'formulas-rendimiento',
  'anastrobold-anastrozole': 'formulas-rendimiento',

  // Viales / inyectables → vanguardia
  '10-ml-concentracion-200-mg-ml': 'vanguardia',
  '4-test-1': 'vanguardia',
  'anabol': 'vanguardia',
  'boldebold-200': 'vanguardia',
  'cypio-test': 'vanguardia',
  'decabold-200': 'vanguardia',
  'decabold-300': 'vanguardia',
  'ena-test': 'vanguardia',
  'mastabold': 'vanguardia',
  'primobold': 'vanguardia',
  'pro-test': 'vanguardia',
  'stan-agua': 'vanguardia',
  'stan-oil-10': 'vanguardia',
  'stan-oil-20': 'vanguardia',
  'super-test': 'vanguardia',
  'testabold': 'vanguardia',
  'thiomobold': 'vanguardia',
  'trenbold': 'vanguardia',
  'tritrembo': 'vanguardia',

  // Ciclos hombres / varones
  'ciclo-basico-de-volumen-y-masa-muscular-magra-para-hombres': 'hombres',
  'ciclo-basico-para-definicion-y-reduccion-de-indice-de-grasa-corporal-en-varones': 'hombres',
  'ciclo-intermedio-4-sustancias': 'hombres',
  'ciclo-intermedio-para-incrementar-masa-muscular-en-varones': 'hombres',

  // Ciclos mujeres
  'ciclo-de-incremento-de-masa-muscular-en-mujeres-y-definicion': 'mujeres',
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!url || !key) {
    console.error('❌ Faltan variables Supabase en .env.local')
    process.exit(1)
  }

  const supabase = createClient(url, key)
  console.log(`\n📂 Asignación de categorías a productos huérfanos${DRY_RUN ? ' (DRY RUN)' : ''}\n`)

  const { data: categories, error: catErr } = await supabase.from('categories').select('id, slug, name')
  if (catErr || !categories) {
    console.error('❌ Error leyendo categorías:', catErr?.message)
    process.exit(1)
  }
  const catBySlug = new Map(categories.map((c) => [c.slug, c]))

  const { data: orphans, error: prodErr } = await supabase
    .from('products')
    .select('id, name, slug, category_id')
    .is('category_id', null)

  if (prodErr || !orphans) {
    console.error('❌ Error leyendo productos:', prodErr?.message)
    process.exit(1)
  }

  let updated = 0
  let skipped = 0

  for (const product of orphans) {
    const targetSlug = SLUG_TO_CATEGORY[product.slug]
    if (!targetSlug) {
      console.warn(`  ⚠️  Sin mapeo para: "${product.name}" (${product.slug})`)
      skipped++
      continue
    }

    const category = catBySlug.get(targetSlug)
    if (!category) {
      console.warn(`  ⚠️  Categoría "${targetSlug}" no existe para: "${product.name}"`)
      skipped++
      continue
    }

    console.log(`  ✏️  ${product.name} → ${category.name} (${targetSlug})`)

    if (DRY_RUN) {
      updated++
      continue
    }

    const primaryId = pickPrimaryCategoryId([category.id], categories)
    const { error: pcErr } = await supabase.from('product_categories').upsert(
      { product_id: product.id, category_id: category.id },
      { onConflict: 'product_id,category_id' },
    )
    if (pcErr) {
      console.error(`     ❌ product_categories: ${pcErr.message}`)
      skipped++
      continue
    }

    const { error: updErr } = await supabase
      .from('products')
      .update({ category_id: primaryId })
      .eq('id', product.id)

    if (updErr) {
      console.error(`     ❌ products: ${updErr.message}`)
      skipped++
      continue
    }

    updated++
  }

  const { count: remaining } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .is('category_id', null)

  console.log(`\n✅ Actualizados: ${updated} | Omitidos: ${skipped} | Sin categoría restantes: ${remaining ?? '?'}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
