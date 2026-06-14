// ============================================================
// sync-category-names.ts
// Alinea categories.name en Supabase con los nombres de Wix / menú.
//
// Uso: npm run sync:category-names
// ============================================================

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { CANONICAL_CATEGORY_NAMES } from '../src/lib/category-nav'

const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const [key, ...vals] = line.split('=')
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

async function main() {
  const { data: cats, error } = await supabase.from('categories').select('id, slug, name')
  if (error) throw error

  console.log('📂 Sincronizando nombres de categorías...\n')

  let updated = 0
  for (const cat of cats ?? []) {
    const canonical = CANONICAL_CATEGORY_NAMES[cat.slug]
    if (!canonical || cat.name === canonical) continue

    const { error: upErr } = await supabase
      .from('categories')
      .update({ name: canonical })
      .eq('id', cat.id)

    if (upErr) {
      console.error(`  ❌ ${cat.slug}: ${upErr.message}`)
      continue
    }

    console.log(`  ✅ ${cat.slug}: "${cat.name}" → "${canonical}"`)
    updated++
  }

  console.log(`\nListo. ${updated} categoría(s) actualizada(s).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
