import { loadEnvLocal } from './load-env-local'

loadEnvLocal()

const WIX_API_KEY = process.env.WIX_API_KEY
const WIX_SITE_ID = process.env.WIX_SITE_ID
const WIX_ACCOUNT_ID = process.env.WIX_ACCOUNT_ID

if (!WIX_API_KEY || !WIX_SITE_ID) {
  console.error('Faltan WIX_API_KEY o WIX_SITE_ID')
  process.exit(1)
}

const headers: Record<string, string> = {
  Authorization: WIX_API_KEY,
  'Content-Type': 'application/json',
  'wix-site-id': WIX_SITE_ID,
}
if (WIX_ACCOUNT_ID) headers['wix-account-id'] = WIX_ACCOUNT_ID

async function main() {
  const res = await fetch('https://www.wixapis.com/site-media/v1/files/query', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: { paging: { limit: 100, offset: 0 } },
      sort: [{ fieldName: 'updatedDate', order: 'DESC' }],
    }),
  })

  const text = await res.text()
  if (!res.ok) {
    console.error(res.status, text.slice(0, 800))
    process.exit(1)
  }

  const data = JSON.parse(text) as {
    files?: Array<{
      displayName?: string
      url?: string
      media?: { video?: { files?: Array<{ url?: string; quality?: string }> } }
      mediaType?: string
    }>
  }

  const files = data.files ?? []
  console.log(`\n${files.length} archivos en media library:\n`)

  for (const f of files) {
    const name = f.displayName ?? '(sin nombre)'
    const raw = JSON.stringify(f)
    if (!/video|\.mp4/i.test(raw)) continue
    console.log('—', name, f.mediaType ?? '')
    console.log(raw.slice(0, 600))
    console.log()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
