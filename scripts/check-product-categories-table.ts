#!/usr/bin/env npx tsx
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const [key, ...vals] = line.split('=')
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
  }
}

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
  const { error } = await supabase.from('product_categories').select('product_id').limit(1)

  if (!error) {
    console.log('✅ Tabla product_categories OK.')
    return
  }

  console.log(`
❌ Falta product_categories.

1. ${sqlUrl}
2. Ejecuta: supabase/migrations/20260607_product_categories.sql
3. npx tsx scripts/check-product-categories-table.ts
`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
