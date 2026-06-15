/**
 * Scrape orden de productos por categoría desde tpharmagold.com
 * Uso: npm run scrape:category-products
 */
import { execSync } from 'child_process'
import { mkdirSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { PREMIUM_CAROUSEL_SLUGS } from '../src/lib/home-carousel-order'

const SITE_URL = 'https://www.tpharmagold.com'

/** slug Supabase → path Wix */
const CATEGORY_WIX_PATHS: Record<string, string> = {
  premium: '/comprar',
  't-health': '/t-health-l-nea-natural',
  suplementos: '/suplementos-tpharma-gold',
  'formulas-rendimiento': '/orales',
  vanguardia: '/viales',
  moduladores: '/sarms',
  'factores-crecimiento': '/hormonas',
}

function scrapeProductSlugs(html: string): string[] {
  const slugs: string[] = []
  const re = /product-page\/([a-zA-Z0-9\u00c0-\u024f-]+)/g
  for (const m of html.matchAll(re)) slugs.push(m[1])
  const seen = new Set<string>()
  return slugs.filter((s) => {
    if (seen.has(s)) return false
    seen.add(s)
    return true
  })
}

function toTsFile(orders: Record<string, string[]>): string {
  const blocks = Object.entries(orders)
    .map(([slug, products]) => {
      const lines = products.map((s) => `    '${s}',`).join('\n')
      return `  '${slug}': [\n${lines}\n  ],`
    })
    .join('\n')

  return `/**
 * Orden de productos por categoría — auto-generado por npm run scrape:category-products
 * Fuente: ${SITE_URL} (${new Date().toISOString().slice(0, 10)})
 */

export const CATEGORY_PRODUCT_SLUG_ORDERS: Record<string, readonly string[]> = {
${blocks}
}
`
}

async function main() {
  const orders: Record<string, string[]> = {}

  for (const [slug, path] of Object.entries(CATEGORY_WIX_PATHS)) {
    const url = `${SITE_URL}${path}`
    console.log(`Scraping ${slug} ← ${url}`)
    const html = execSync(`curl -sL '${url}'`, {
      encoding: 'utf8',
      maxBuffer: 15 * 1024 * 1024,
    })
    const products =
      slug === 'premium'
        ? [...PREMIUM_CAROUSEL_SLUGS]
        : scrapeProductSlugs(html)
    orders[slug] = products
    console.log(`  ${products.length} productos`)
    if (slug === 'premium') {
      products.slice(0, 5).forEach((s, i) => console.log(`    ${i + 1}. ${s}`))
    }
  }

  const target = resolve(__dirname, '../src/lib/category-product-order.ts')
  writeFileSync(target, toTsFile(orders))
  console.log(`\n✅ Written ${target}`)

  const snapshot = resolve(__dirname, '../data/wix-category-products.json')
  mkdirSync(resolve(__dirname, '../data'), { recursive: true })
  writeFileSync(snapshot, JSON.stringify({ scrapedAt: new Date().toISOString(), orders }, null, 2))
  console.log(`Snapshot: ${snapshot}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
