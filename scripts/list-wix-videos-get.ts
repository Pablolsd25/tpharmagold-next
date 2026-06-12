import { loadEnvLocal } from './load-env-local'

loadEnvLocal()

const WIX_API_KEY = process.env.WIX_API_KEY
const WIX_SITE_ID = process.env.WIX_SITE_ID ?? '27591029-2e81-4653-b199-adb1e8615fc9'

if (!WIX_API_KEY) {
  console.error('Falta WIX_API_KEY')
  process.exit(1)
}

const headers = {
  Authorization: WIX_API_KEY,
  'wix-site-id': WIX_SITE_ID,
  'Content-Type': 'application/json',
}

async function main() {
  const all: Array<{ displayName?: string; mediaType?: string; url?: string; id?: string; media?: unknown }> = []
  let cursor: string | null = null

  for (let page = 0; page < 50; page++) {
    const params = new URLSearchParams({ 'paging.limit': '100' })
    if (cursor) params.set('paging.cursor', cursor)

    const res = await fetch(`https://www.wixapis.com/site-media/v1/files?${params}`, { headers })
    if (!res.ok) {
      console.error(res.status, await res.text())
      break
    }
    const data = (await res.json()) as {
      files?: typeof all
      pagingMetadata?: { cursors?: { next?: string } }
    }
    const files = data.files ?? []
    all.push(...files)
    cursor = data.pagingMetadata?.cursors?.next ?? null
    if (!cursor || files.length === 0) break
  }

  const types = new Map<string, number>()
  for (const f of all) types.set(f.mediaType ?? '?', (types.get(f.mediaType ?? '?') ?? 0) + 1)
  console.log('Total', all.length, 'tipos:', Object.fromEntries(types))

  const videos = all.filter((f) => f.mediaType === 'VIDEO')
  console.log('\nVideos:', videos.length)
  for (const v of videos) {
    console.log('—', v.displayName, v.id)
    console.log('  url:', v.url)
    console.log('  media:', JSON.stringify(v.media).slice(0, 400))
  }
}

main()
