/**
 * Scrape menú MENÚ de https://www.tpharmagold.com/ y valida orden de categorías.
 * Uso: npm run scrape:menu-categories
 */
import { mkdirSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'
import { resolve } from 'path'
import {
  CANONICAL_CATEGORY_NAMES,
  CATEGORY_MENU_SLUG_ORDER,
} from '../src/lib/category-nav'

const SITE_URL = 'https://www.tpharmagold.com/'

const WIX_PATH_TO_SLUG: Record<string, string> = {
  '/': '_inicio',
  '/comprar': 'premium',
  '/premium': 'premium',
  '/t-health-l-nea-natural': 't-health',
  '/suplementos-tpharma-gold': 'suplementos',
  '/orales': 'formulas-rendimiento',
  '/viales': 'vanguardia',
  '/sarms': 'moduladores',
  '/hormonas': 'factores-crecimiento',
  '/about-1': '_testimonios',
  '/ofertas-del-mes': '_ofertas',
}

function parseMenu(html: string) {
  const idx = html.indexOf('id="hyu7izfs"')
  const chunk = idx >= 0 ? html.slice(idx, idx + 25000) : html
  const items: Array<{ label: string; href: string; slug: string | null }> = []
  const linkRe = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi

  for (const m of chunk.matchAll(linkRe)) {
    const href = m[1].replace(/&amp;/g, '&')
    const inner = m[2].replace(/<[^>]+>/g, ' ')
    const label = inner.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
    if (!label || label.length > 80) continue
    if (label === 'MENÚ' || label === 'More' || label === 'Use tab to navigate through the menu items.') {
      continue
    }

    let path = href
    try {
      path = new URL(href, SITE_URL).pathname
    } catch {
      /* keep */
    }

    const mapped = WIX_PATH_TO_SLUG[path]
    const slug = mapped && !mapped.startsWith('_') ? mapped : null

    items.push({ label, href, slug })
  }

  const seen = new Set<string>()
  return items.filter((item) => {
    const key = `${item.label}|${item.href}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function main() {
  console.log(`Fetching ${SITE_URL}...`)
  const html = execSync(`curl -sL '${SITE_URL}'`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
  const menu = parseMenu(html)

  console.log('\n=== Menú Wix (orden DOM) ===')
  for (const item of menu) {
    console.log(`  ${item.label.padEnd(42)} ${item.slug ?? '(página)'}`)
  }

  const scrapedSlugs: string[] = []
  for (const item of menu) {
    if (
      item.slug &&
      (CATEGORY_MENU_SLUG_ORDER as readonly string[]).includes(item.slug) &&
      !scrapedSlugs.includes(item.slug)
    ) {
      scrapedSlugs.push(item.slug)
    }
  }

  console.log('\n=== Categorías en menú ===')
  scrapedSlugs.forEach((slug, i) => {
    const expected = CATEGORY_MENU_SLUG_ORDER[i]
    const ok = slug === expected
    console.log(`  ${i + 1}. ${slug} ${ok ? '✓' : `✗ (esperado: ${expected ?? '—'})`}`)
  })

  if (scrapedSlugs.join(',') !== [...CATEGORY_MENU_SLUG_ORDER].join(',')) {
    console.warn('\n⚠️  El orden en category-nav.ts no coincide con el scrape.')
    console.warn('   Actualiza CATEGORY_MENU_SLUG_ORDER y TPHARMA_MENU_NAV.')
  } else {
    console.log('\n✅ category-nav.ts coincide con tpharmagold.com')
  }

  const snapshot = {
    scrapedAt: new Date().toISOString(),
    menu: menu.map((m) => ({ label: m.label, slug: m.slug, href: m.href })),
    categorySlugs: scrapedSlugs,
    canonicalNames: CANONICAL_CATEGORY_NAMES,
  }
  const outPath = resolve(__dirname, '../data/wix-menu-snapshot.json')
  mkdirSync(resolve(__dirname, '../data'), { recursive: true })
  writeFileSync(outPath, JSON.stringify(snapshot, null, 2))
  console.log(`\nSnapshot: ${outPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
