// Descubre el Site ID de Wix para tpharmagold.com
// Uso: npx tsx scripts/discover-wix-site.ts

import { loadEnvLocal } from './load-env-local'

loadEnvLocal()

const WIX_API_KEY = process.env.WIX_API_KEY
const WIX_ACCOUNT_ID = process.env.WIX_ACCOUNT_ID

if (!WIX_API_KEY) {
  console.error('❌ Falta WIX_API_KEY en .env.local')
  process.exit(1)
}

const headers: Record<string, string> = {
  Authorization: WIX_API_KEY,
  'Content-Type': 'application/json',
}
if (WIX_ACCOUNT_ID) headers['wix-account-id'] = WIX_ACCOUNT_ID

async function listSites() {
  const res = await fetch('https://www.wixapis.com/site-list/v2/sites/query', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: { paging: { limit: 50, offset: 0 } },
    }),
  })

  const text = await res.text()
  if (!res.ok) {
    console.error('❌ Error listando sitios:', res.status, text)
    process.exit(1)
  }

  const data = JSON.parse(text) as {
    sites?: Array<{
      id: string
      displayName?: string
      url?: string
      name?: string
    }>
  }

  const sites = data.sites ?? []
  if (sites.length === 0) {
    console.log('No se encontraron sitios en esta cuenta.')
    return
  }

  console.log('\n📋 Sitios Wix en tu cuenta:\n')
  for (const site of sites) {
    const name = site.displayName ?? site.name ?? '(sin nombre)'
    const url = site.url ?? ''
    const marker = url.includes('tpharmagold') ? ' ← T PHARMA GOLD' : ''
    console.log(`  ID:   ${site.id}`)
    console.log(`  Nombre: ${name}`)
    console.log(`  URL:  ${url}${marker}`)
    console.log('')
  }

  const tpharma = sites.find((s) => (s.url ?? '').includes('tpharmagold'))
  if (tpharma) {
    console.log('✅ Agrega esto a .env.local:')
    console.log(`WIX_SITE_ID=${tpharma.id}`)
  } else {
    console.log('⚠️  No se detectó tpharmagold.com automáticamente.')
    console.log('   Copia el ID del sitio correcto y ponlo en WIX_SITE_ID.')
  }
}

async function listCollections(siteId: string) {
  const res = await fetch('https://www.wixapis.com/stores-reader/v1/collections/query', {
    method: 'POST',
    headers: { ...headers, 'wix-site-id': siteId },
    body: JSON.stringify({ query: { paging: { limit: 100 } } }),
  })

  const text = await res.text()
  if (!res.ok) {
    console.error('❌ Error listando colecciones:', res.status, text)
    return
  }

  const data = JSON.parse(text) as { collections?: Array<{ id: string; name: string }> }
  console.log(`\n📂 Colecciones en site ${siteId}:\n`)
  for (const col of data.collections ?? []) {
    console.log(`  - ${col.name} (${col.id})`)
  }
}

async function main() {
  await listSites()

  const siteId = process.env.WIX_SITE_ID
  if (siteId) {
    await listCollections(siteId)
  } else {
    console.log('\n💡 Define WIX_SITE_ID y vuelve a correr para ver colecciones.')
  }
}

main().catch((err) => {
  console.error('❌', err)
  process.exit(1)
})
