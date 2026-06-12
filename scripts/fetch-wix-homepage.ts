import { loadEnvLocal } from './load-env-local'

loadEnvLocal()

const WIX_API_KEY = process.env.WIX_API_KEY!
const WIX_SITE_ID = process.env.WIX_SITE_ID ?? '27591029-2e81-4653-b199-adb1e8615fc9'

const headers = {
  Authorization: WIX_API_KEY,
  'wix-site-id': WIX_SITE_ID,
  'Content-Type': 'application/json',
}

async function main() {
  // List pages
  const pagesRes = await fetch('https://www.wixapis.com/site-pages/v1/pages/query', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: { paging: { limit: 50 } } }),
  })
  console.log('pages status', pagesRes.status)
  const pagesText = await pagesRes.text()
  if (!pagesRes.ok) {
    console.log(pagesText.slice(0, 500))
    return
  }
  const pages = JSON.parse(pagesText) as { pages?: Array<{ id: string; title?: string; url?: { path?: string } }> }
  for (const p of pages.pages ?? []) {
    console.log(p.id, p.title, p.url?.path)
  }

  const home = pages.pages?.find((p) => p.url?.path === '/' || p.title?.toLowerCase() === 'home')
  if (!home?.id) {
    console.log('No home page id')
    return
  }

  const contentRes = await fetch(`https://www.wixapis.com/site-pages/v1/pages/${home.id}`, { headers })
  const contentText = await contentRes.text()
  console.log('\npage content status', contentRes.status, 'len', contentText.length)

  const videoMatches = contentText.match(/video\.wixstatic\.com\/video\/[a-z0-9_]+/gi) ?? []
  const wixVideo = contentText.match(/wix:video:\/\/[^"\\]+/gi) ?? []
  const mp4 = contentText.match(/[a-f0-9]{6}_[a-f0-9]{32}/gi) ?? []

  console.log('video urls', [...new Set(videoMatches)])
  console.log('wix video uris', [...new Set(wixVideo)].slice(0, 5))
  console.log('media ids sample', [...new Set(mp4)].slice(0, 20))

  // dump snippet around VideoPlayer
  const idx = contentText.indexOf('VideoPlayer')
  if (idx >= 0) console.log('\nVideoPlayer snippet:\n', contentText.slice(idx, idx + 2000))
}

main()
