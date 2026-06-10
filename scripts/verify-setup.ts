// Verifica que Supabase y Wix estén listos antes de migrar
// Uso: npx tsx scripts/verify-setup.ts

import { createClient } from '@supabase/supabase-js'
import { loadEnvLocal } from './load-env-local'

loadEnvLocal()

const checks: Array<{ label: string; ok: boolean; hint?: string }> = []

function check(label: string, ok: boolean, hint?: string) {
  checks.push({ label, ok, hint })
}

check('WIX_API_KEY', Boolean(process.env.WIX_API_KEY))
check('WIX_SITE_ID', Boolean(process.env.WIX_SITE_ID), 'npx tsx scripts/discover-wix-site.ts')
check('NEXT_PUBLIC_SUPABASE_URL', Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL))
check('NEXT_PUBLIC_SUPABASE_ANON_KEY', Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
check('SUPABASE_SERVICE_ROLE_KEY', Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY))
check('ADMIN_EMAILS', Boolean(process.env.ADMIN_EMAILS?.trim()), 'tu email para acceder al panel admin')
check('NEXT_PUBLIC_SITE_URL', Boolean(process.env.NEXT_PUBLIC_SITE_URL), 'https://www.tpharmagold.com')

async function verifySupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return

  const supabase = createClient(url, key)
  const { error: catErr } = await supabase.from('categories').select('id').limit(1)
  check('Tabla categories en Supabase', !catErr, catErr?.message ?? 'Ejecuta supabase/bootstrap.sql')

  const { data: buckets } = await supabase.storage.listBuckets()
  const hasImages = (buckets ?? []).some((b) => b.name === 'images')
  check('Bucket images en Storage', hasImages, 'Se crea automáticamente al migrar productos')
}

async function verifyWix() {
  const key = process.env.WIX_API_KEY
  const siteId = process.env.WIX_SITE_ID
  if (!key || !siteId) return

  const headers: Record<string, string> = {
    Authorization: key,
    'wix-site-id': siteId,
    'Content-Type': 'application/json',
  }
  if (process.env.WIX_ACCOUNT_ID) headers['wix-account-id'] = process.env.WIX_ACCOUNT_ID

  const res = await fetch('https://www.wixapis.com/stores-reader/v1/products/query', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: { paging: { limit: 1 } } }),
  })
  check('API Wix Stores (productos)', res.ok, res.ok ? undefined : await res.text())
}

async function main() {
  console.log('\n🔍 Verificando setup T Pharma Gold\n')
  await verifySupabase()
  await verifyWix()

  let allOk = true
  for (const c of checks) {
    const icon = c.ok ? '✅' : '❌'
    console.log(`${icon} ${c.label}`)
    if (!c.ok && c.hint) console.log(`   → ${c.hint}`)
    if (!c.ok) allOk = false
  }

  console.log(allOk ? '\n✅ Todo listo para migrar (npm run migrate:api)' : '\n⚠️  Completa lo que falta arriba.')
  process.exit(allOk ? 0 : 1)
}

main().catch((err) => {
  console.error('❌', err)
  process.exit(1)
})
