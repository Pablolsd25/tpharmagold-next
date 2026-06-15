#!/usr/bin/env npx tsx
/**
 * Verifica tablas de variantes y muestra SQL a aplicar si faltan.
 * Uso: npx tsx scripts/check-product-options-table.ts
 */
import { createClient } from '@supabase/supabase-js'
import { loadEnvLocal } from './load-env-local'

loadEnvLocal()

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!url || !key) {
    console.error('❌ Faltan variables Supabase en .env.local')
    process.exit(1)
  }

  const ref = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  const sqlUrl = ref
    ? `https://supabase.com/dashboard/project/${ref}/sql/new`
    : 'https://supabase.com/dashboard'

  const supabase = createClient(url, key)

  const { error: optErr } = await supabase.from('product_options').select('id').limit(1)
  const { error: valErr } = await supabase.from('product_option_values').select('id').limit(1)

  if (!optErr && !valErr) {
    const { count: optCount } = await supabase
      .from('product_options')
      .select('*', { count: 'exact', head: true })
    const { data: rows } = await supabase.from('product_options').select('product_id')
    const unique = new Set((rows ?? []).map((r) => r.product_id)).size
    console.log('✅ Tablas product_options / product_option_values OK.')
    console.log(`   Opciones: ${optCount ?? 0} filas | Productos con variantes: ${unique}`)
    return
  }

  console.log(`
❌ Faltan tablas de variantes en Supabase.

1. Abre: ${sqlUrl}
2. Pega y ejecuta: supabase/migrations/20260613_product_options.sql
3. Vuelve a correr:
   npx tsx scripts/check-product-options-table.ts
   npx tsx scripts/migrate-variants.ts
`)
  if (optErr) console.log('   product_options:', optErr.message)
  if (valErr) console.log('   product_option_values:', valErr.message)
  process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
