/**
 * Sincroniza descripciones de productos desde Wix → Supabase.
 * Uso: npx tsx scripts/sync-product-descriptions.ts
 *      npx tsx scripts/sync-product-descriptions.ts --dry-run
 */
import { createClient } from '@supabase/supabase-js'
import { descriptionsEquivalent, normalizeWixDescription } from '../src/lib/wix-description'
import { loadEnvLocal } from './load-env-local'

loadEnvLocal()

const DRY_RUN = process.argv.includes('--dry-run')
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
  description?: string
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

    if (!res.ok) throw new Error(`Wix API: ${await res.text()}`)

    const data = (await res.json()) as { products?: WixProduct[] }
    const batch = data.products ?? []
    all = [...all, ...batch]
    if (batch.length < limit) break
    offset += limit
  }

  return all
}

async function main() {
  console.log(`\n📝 Sincronizar descripciones Wix → Supabase${DRY_RUN ? ' (DRY RUN)' : ''}\n`)

  const wix = await fetchAllWixProducts()
  const { data: sbProducts, error } = await supabase
    .from('products')
    .select('id, name, slug, wix_id, description')

  if (error || !sbProducts) {
    console.error('❌ Error leyendo Supabase:', error?.message)
    process.exit(1)
  }

  const byWixId = new Map(sbProducts.filter((p) => p.wix_id).map((p) => [p.wix_id as string, p]))
  const bySlug = new Map(sbProducts.map((p) => [p.slug, p]))

  let updated = 0
  let alreadyOk = 0
  let notFound = 0

  for (const wp of wix) {
    const sb = byWixId.get(wp.id) ?? bySlug.get(wp.slug)
    if (!sb) {
      console.warn(`  ⚠️  No en Supabase: ${wp.name}`)
      notFound++
      continue
    }

    const raw = (wp.description ?? '').trim()
    const normalized = normalizeWixDescription(raw)

    if (descriptionsEquivalent(sb.description, normalized)) {
      alreadyOk++
      continue
    }

    console.log(`  📦 ${wp.name}`)
    if (DRY_RUN) {
      console.log(`     [DRY RUN] actualizaría descripción (${(sb.description ?? '').length} → ${normalized.length} chars)`)
      updated++
      continue
    }

    const { error: updErr } = await supabase
      .from('products')
      .update({ description: normalized || null })
      .eq('id', sb.id)

    if (updErr) {
      console.error(`     ❌ ${updErr.message}`)
      continue
    }

    updated++
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Actualizados:  ${updated}
⏭️  Ya correctos:  ${alreadyOk}
❌ No encontrados: ${notFound}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
