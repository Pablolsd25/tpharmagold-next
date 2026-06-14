/**
 * Scrape carousel product order from https://www.tpharmagold.com/
 * Uso: npm run scrape:home-carousels
 */
import { writeFileSync } from 'fs'
import { resolve } from 'path'

const URL = 'https://www.tpharmagold.com/'

/** Slides 17–19 del widget premium (19 total) no vienen en SSR; orden del sitio en vivo. */
const PREMIUM_TAIL_FROM_LIVE = [
  'abs-booty-legs-pink-protein',
  'abs-booty-legs-max-pink-protein',
  'chest-max-volume-protein',
] as const

type Widget = { total: number; slugs: string[] }

function parseWidgets(html: string): Widget[] {
  const parts = html.split(/--totalNumberOfProducts:(\d+)/)
  const widgets: Widget[] = []

  for (let i = 1; i < parts.length; i += 2) {
    const total = Number(parts[i])
    const chunk = parts[i + 1] ?? ''
    const raw = [...chunk.matchAll(/data-slug="([^"]+)"/g)].map((m) => m[1])
    const slugs = raw.filter((s) => s.includes('-') && s.length > 5)
    const seen = new Set<string>()
    const ordered: string[] = []
    for (const s of slugs) {
      if (!seen.has(s)) {
        seen.add(s)
        ordered.push(s)
      }
    }
    widgets.push({ total, slugs: ordered })
  }
  return widgets
}

function toTsConst(name: string, slugs: string[], comment: string): string {
  const lines = slugs.map((s) => `  '${s}',`).join('\n')
  return `/** ${comment} */\nexport const ${name} = [\n${lines}\n] as const`
}

async function main() {
  console.log(`Fetching ${URL}...`)
  const res = await fetch(URL)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()
  const widgets = parseWidgets(html)

  if (widgets.length < 3) {
    throw new Error(`Expected 3 carousel widgets, got ${widgets.length}`)
  }

  const [premium, mujeres, hombres] = widgets
  console.log(`Premium: ${premium.slugs.length} SSR slugs, widget total=${premium.total}`)
  console.log(`Mujeres: ${mujeres.slugs.length} slugs, total=${mujeres.total}`)
  console.log(`Hombres: ${hombres.slugs.length} slugs, total=${hombres.total}`)

  let premiumSlugs = [...premium.slugs]
  if (premium.total === 19 && premiumSlugs.length === 16) {
    premiumSlugs = [...premiumSlugs, ...PREMIUM_TAIL_FROM_LIVE]
    console.log('Premium: appended 3 live-only tail slugs (17–19)')
  }

  const out = `/**
 * Órdenes de carruseles del home — auto-generado por npm run scrape:home-carousels
 * Fuente: ${URL} (${new Date().toISOString().slice(0, 10)})
 */

${toTsConst('PREMIUM_CAROUSEL_SLUGS', premiumSlugs, `Widget Productos Premium — totalNumberOfProducts: ${premium.total}`)}

${toTsConst('MUJERES_CAROUSEL_SLUGS', mujeres.slugs, `Widget Lo que ellas aman — totalNumberOfProducts: ${mujeres.total}`)}

${toTsConst('HOMBRES_CAROUSEL_SLUGS', hombres.slugs, `Widget Lo que ellos prefieren — totalNumberOfProducts: ${hombres.total}`)}

export const HOME_CAROUSEL_SLUGS = {
  premium: [...PREMIUM_CAROUSEL_SLUGS],
  mujeres: [...MUJERES_CAROUSEL_SLUGS],
  hombres: [...HOMBRES_CAROUSEL_SLUGS],
} as const
`

  const target = resolve(__dirname, '../src/lib/home-carousel-order.ts')
  writeFileSync(target, out)
  console.log(`\n✅ Written ${target}`)
  console.log('\nPremium order:')
  premiumSlugs.forEach((s, i) => console.log(`  ${i + 1}. ${s}`))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
