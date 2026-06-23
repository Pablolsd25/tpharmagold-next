/**
 * Completa image_url de categorías sin portada en Wix:
 * - ofertas: imagen de colección "Oferta del Mes"
 * - hombres / mujeres: primera imagen de producto destacado en esa categoría
 *
 * Uso: npx tsx scripts/sync-missing-category-images.ts [--dry-run]
 */
import { createClient } from '@supabase/supabase-js'
import { loadEnvLocal } from './load-env-local'
import { compressImageBuffer } from '../src/lib/utils/image-compress-server'

loadEnvLocal()

const DRY_RUN = process.argv.includes('--dry-run')
const WIX_API_KEY = process.env.WIX_API_KEY!
const WIX_SITE_ID = process.env.WIX_SITE_ID!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!)
const wixHeaders: Record<string, string> = {
  Authorization: WIX_API_KEY!,
  'wix-site-id': WIX_SITE_ID!,
  'Content-Type': 'application/json',
}
if (process.env.WIX_ACCOUNT_ID) wixHeaders['wix-account-id'] = process.env.WIX_ACCOUNT_ID

async function download(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) })
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}

async function upload(buffer: Buffer, slug: string): Promise<string | null> {
  const compressed = await compressImageBuffer(buffer)
  const path = `categories/${slug}.${compressed.extension}`
  const { data, error } = await supabase.storage
    .from('images')
    .upload(path, compressed.buffer, { contentType: compressed.contentType, upsert: true })
  if (error) return null
  return supabase.storage.from('images').getPublicUrl(data.path).data.publicUrl
}

function extractImageUrl(media: { mainMedia?: { image?: { url?: string; id?: string } }; items?: Array<{ image?: { url?: string; id?: string } }> } | undefined): string | null {
  if (!media) return null
  const main = media.mainMedia?.image
  if (main?.url) return main.url
  const first = media.items?.[0]?.image
  if (first?.url) return first.url
  return null
}

async function setCategoryImage(slug: string, sourceUrl: string, label: string) {
  const { data: cat } = await supabase.from('categories').select('id, image_url').eq('slug', slug).single()
  if (!cat) {
    console.warn(`  ⚠️  Categoría no encontrada: ${slug}`)
    return
  }
  if (cat.image_url?.includes('.supabase.co/storage/')) {
    console.log(`  ✓ ${slug}: ya tiene imagen`)
    return
  }

  console.log(`  📥 ${slug} ← ${label}`)

  if (DRY_RUN) {
    console.log(`     → images/categories/${slug}.jpg`)
    return
  }

  const buffer = await download(sourceUrl)
  if (!buffer) {
    console.warn(`     ❌ No se pudo descargar`)
    return
  }

  const publicUrl = await upload(buffer, slug)
  if (!publicUrl) {
    console.warn(`     ❌ Error subiendo`)
    return
  }

  const { error } = await supabase.from('categories').update({ image_url: publicUrl }).eq('id', cat.id)
  if (error) console.warn(`     ❌ DB:`, error.message)
  else console.log(`     ✅ ${publicUrl}`)
}

async function productFallbackImage(categorySlug: string): Promise<string | null> {
  const { data: cat } = await supabase.from('categories').select('id').eq('slug', categorySlug).single()
  if (!cat) return null

  const { data: links } = await supabase
    .from('product_categories')
    .select('product_id')
    .eq('category_id', cat.id)
    .limit(1)

  const productId = links?.[0]?.product_id
  if (!productId) return null

  const { data: product } = await supabase.from('products').select('images').eq('id', productId).single()
  return product?.images?.[0] ?? null
}

async function main() {
  console.log(`\n🖼️  Categorías sin imagen${DRY_RUN ? ' (DRY RUN)' : ''}\n`)

  // ofertas desde colección Wix
  const colRes = await fetch('https://www.wixapis.com/stores-reader/v1/collections/query', {
    method: 'POST',
    headers: wixHeaders,
    body: JSON.stringify({ query: { paging: { limit: 50 } } }),
  })
  const { collections } = (await colRes.json()) as { collections?: Array<{ name: string; media?: unknown }> }
  const ofertasColl = collections?.find((c) => c.name.toLowerCase().includes('oferta'))
  const ofertasImg = extractImageUrl(ofertasColl?.media as Parameters<typeof extractImageUrl>[0])
  if (ofertasImg) await setCategoryImage('ofertas', ofertasImg, ofertasColl!.name)
  else console.warn('  ⚠️  Sin imagen Wix para ofertas')

  for (const slug of ['hombres', 'mujeres'] as const) {
    const img = await productFallbackImage(slug)
    if (img) await setCategoryImage(slug, img, `producto en ${slug}`)
    else console.warn(`  ⚠️  Sin producto con imagen para ${slug}`)
  }

  console.log('\n✅ Listo')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
