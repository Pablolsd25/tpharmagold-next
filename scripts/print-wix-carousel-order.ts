import { loadEnvLocal } from './load-env-local'
import { resolveCategorySlug } from './wix-migration-config'

loadEnvLocal()

const headers: Record<string, string> = {
  Authorization: process.env.WIX_API_KEY!,
  'wix-site-id': process.env.WIX_SITE_ID!,
  'Content-Type': 'application/json',
}
if (process.env.WIX_ACCOUNT_ID) headers['wix-account-id'] = process.env.WIX_ACCOUNT_ID

async function fetchCollectionSlugs(match: (name: string) => boolean) {
  const colRes = await fetch('https://www.wixapis.com/stores-reader/v1/collections/query', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: { paging: { limit: 100 } } }),
  })
  const cols = ((await colRes.json()) as { collections: Array<{ id: string; name: string }> })
    .collections ?? []
  const col = cols.find((c) => match(c.name))
  if (!col) return { name: 'NOT FOUND', slugs: [] as string[] }

  const slugs: string[] = []
  let offset = 0
  while (true) {
    const res = await fetch('https://www.wixapis.com/stores-reader/v1/products/query', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        includeHiddenProducts: true,
        query: {
          filter: JSON.stringify({ 'collections.id': { $hasSome: [col.id] } }),
          paging: { limit: 100, offset },
        },
      }),
    })
    const data = (await res.json()) as { products?: Array<{ slug?: string; name: string }> }
    const batch = data.products ?? []
    for (const p of batch) slugs.push(p.slug ?? p.name)
    if (batch.length < 100) break
    offset += 100
  }
  return { name: col.name, slugs }
}

async function main() {
  const colRes = await fetch('https://www.wixapis.com/stores-reader/v1/collections/query', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: { paging: { limit: 100 } } }),
  })
  const cols = ((await colRes.json()) as { collections: Array<{ id: string; name: string }> })
    .collections ?? []
  console.log('Collections:')
  for (const c of cols) {
    if (c.name === 'All Products') continue
    console.log(` - ${c.name} → ${resolveCategorySlug(c.name) ?? '(no slug)'}`)
  }

  const targets = [
    { label: 'premium', match: (n: string) => n.toUpperCase() === 'PREMIUM' },
    { label: 'mujeres', match: (n: string) => /ellas|women|pink|favoritos/i.test(n) },
    { label: 'hombres', match: (n: string) => resolveCategorySlug(n) === 'hombres' },
  ]

  for (const t of targets) {
    const r = await fetchCollectionSlugs(t.match)
    console.log(`\n// ${t.label} — ${r.name}`)
    console.log('export const', t.label.toUpperCase() + '_HOME_SLUGS = [')
    for (const s of r.slugs) console.log(`  '${s}',`)
    console.log('] as const')
  }
}

main()
