// ============================================================
// sync-category-order.ts
// Alinea categories.sort_order con el menú Wix (category-nav.ts)
//
// Uso: npm run sync:category-order
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { loadEnvLocal } from './load-env-local'
import { CATEGORY_DISPLAY_ORDER } from '../src/lib/category-nav'

loadEnvLocal()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

async function main() {
  // sort_order es opcional hasta aplicar migración 20260611_categories_sort_order.sql
  const { error: probeErr } = await supabase.from('categories').select('sort_order').limit(1)
  if (probeErr?.message?.includes('sort_order')) {
    console.log('⚠️  Columna categories.sort_order no existe. Aplica la migración en Supabase:')
    console.log('   supabase/migrations/20260611_categories_sort_order.sql\n')
    console.log('El orden en la app ya funciona vía category-nav.ts (sin DB).')
    return
  }

  const { data: catsWithOrder, error: orderErr } = await supabase
    .from('categories')
    .select('id, slug, name, sort_order')
  if (orderErr) throw orderErr

  console.log('📂 Sincronizando sort_order de categorías...\n')

  const rank = new Map(CATEGORY_DISPLAY_ORDER.map((slug, i) => [slug, i]))
  const unknown = (catsWithOrder ?? [])
    .filter((c) => !rank.has(c.slug))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  const unknownRank = new Map(unknown.map((c, i) => [c.id, 100 + i]))
  let updated = 0

  for (const cat of catsWithOrder ?? []) {
    const nextOrder = rank.get(cat.slug) ?? unknownRank.get(cat.id) ?? 999
    if (cat.sort_order === nextOrder) continue

    const { error: upErr } = await supabase
      .from('categories')
      .update({ sort_order: nextOrder })
      .eq('id', cat.id)

    if (upErr) {
      console.error(`  ❌ ${cat.slug}: ${upErr.message}`)
      continue
    }

    console.log(`  ✅ ${cat.slug}: sort_order ${cat.sort_order} → ${nextOrder}`)
    updated++
  }

  console.log(`\nListo. ${updated} categoría(s) actualizada(s).`)
  console.log('\nOrden del menú:')
  for (const slug of CATEGORY_DISPLAY_ORDER) {
    const cat = (catsWithOrder ?? []).find((c) => c.slug === slug)
    if (cat) console.log(`  • ${cat.name} (${slug})`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
