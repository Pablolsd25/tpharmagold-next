/**
 * Scrape imágenes y orden de testimonios Pink Kit desde tpharmagold.com/about-1
 * Uso: npm run scrape:pink-kit-testimonios
 */
import { execSync } from 'child_process'
import { mkdirSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const URL = 'https://www.tpharmagold.com/about-1'

function uniqueInOrder(html: string, re: RegExp): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const m of html.matchAll(re)) {
    const id = m[1]
    if (!seen.has(id)) {
      seen.add(id)
      out.push(id)
    }
  }
  return out
}

function main() {
  const html = execSync(`curl -sL '${URL}'`, {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  })

  const allJpeg = uniqueInOrder(html, /(98134b_[a-f0-9]+~mv2\.jpe?g)/g)
  const product = allJpeg.find((id) => id.includes('c0c25728'))
  const featured = allJpeg.filter(
    (id) =>
      id.includes('29ec5379') ||
      id.includes('a8230a3c') ||
      id.includes('17fd3f8c'),
  )
  const gallery = allJpeg.filter(
    (id) =>
      id !== product &&
      !featured.includes(id) &&
      !id.includes('7693b9fb'),
  )

  const snapshot = {
    scrapedAt: new Date().toISOString(),
    url: URL,
    product,
    featured,
    gallery,
    total: allJpeg.length,
  }

  const dataDir = resolve(__dirname, '../data')
  mkdirSync(dataDir, { recursive: true })
  const out = resolve(dataDir, 'wix-pink-kit-testimonios.json')
  writeFileSync(out, JSON.stringify(snapshot, null, 2))

  console.log(`✅ ${out}`)
  console.log(`  product: ${product ?? '(missing)'}`)
  console.log(`  featured: ${featured.length}`)
  console.log(`  gallery: ${gallery.length}`)
}

main()
