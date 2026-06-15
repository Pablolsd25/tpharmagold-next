/**
 * Importa productos de Wix que faltan en Supabase (por wix_id).
 * Uso: npx tsx scripts/import-missing-wix-products.ts
 *      npx tsx scripts/import-missing-wix-products.ts --dry-run
 */
import { createClient } from '@supabase/supabase-js'
import { compressImageBuffer } from '../src/lib/utils/image-compress-server'
import { loadEnvLocal } from './load-env-local'
import {
  PRIMARY_CATEGORY_SLUGS,
  WIX_OFFER_COLLECTIONS,
  resolveCategorySlug,
} from './wix-migration-config'

loadEnvLocal()

const DRY_RUN = process.argv.includes('--dry-run')
const WIX_API_KEY = process.env.WIX_API_KEY!
const WIX_SITE_ID = process.env.WIX_SITE_ID!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!WIX_API_KEY || !WIX_SITE_ID || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Faltan variables en .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const wixHeaders: Record<string, string> = {
  Authorization: WIX_API_KEY,
  'wix-site-id': WIX_SITE_ID,
  'Content-Type': 'application/json',
}
if (process.env.WIX_ACCOUNT_ID) {
  wixHeaders['wix-account-id'] = process.env.WIX_ACCOUNT_ID
}

interface WixProduct {
  id: string
  name: string
  slug: string
  description?: string
  visible?: boolean
  collectionIds?: string[]
  tags?: string[]
  priceData?: {
    price?: string | number
    discountedPrice?: string | number
    compareAtPrice?: string | number
  }
  stock?: {
    trackQuantity?: boolean
    quantity?: number
    inStock?: boolean
  }
  media?: {
    items?: Array<{ image?: { url?: string } }>
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

async function downloadBuffer(url: string): Promise<Buffer | null> {
  try {
    let resolved = url
    if (resolved.startsWith('wix:image://')) {
      const fileId = resolved.replace('wix:image://v1/', '').split('/')[0].split('#')[0]
      resolved = `https://static.wixstatic.com/media/${fileId}`
    }
    const res = await fetch(resolved)
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}

async function uploadImage(buffer: Buffer, slug: string, index: number): Promise<string | null> {
  const compressed = await compressImageBuffer(buffer)
  const storagePath = `products/${slug}-${index}.${compressed.extension}`
  const { data, error } = await supabase.storage
    .from('images')
    .upload(storagePath, compressed.buffer, { contentType: compressed.contentType, upsert: true })

  if (error) return null

  const { data: pub } = supabase.storage.from('images').getPublicUrl(data.path)
  return pub.publicUrl
}

async function fetchAllWixProducts(): Promise<WixProduct[]> {
  let all: WixProduct[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const res = await fetch('https://www.wixapis.com/stores-reader/v1/products/query', {
      method: 'POST',
      headers: wixHeaders,
      body: JSON.stringify({
        includeHiddenProducts: true,
        query: { paging: { limit, offset } },
      }),
    })

    if (!res.ok) throw new Error(`Wix API: ${await res.text()}`)

    const data = (await res.json()) as { products?: WixProduct[] }
    const batch = data.products ?? []
    all = [...all, ...batch]
    if (batch.length < limit) break
    offset += limit
  }

  return all
}

async function buildCategoryMap(): Promise<Map<string, string>> {
  const { data: categories } = await supabase.from('categories').select('id, slug, wix_id')
  const map = new Map<string, string>()
  for (const c of categories ?? []) {
    if (c.wix_id) map.set(c.wix_id, c.id)
  }
  return map
}

async function fetchWixCollections(): Promise<Map<string, string>> {
  const res = await fetch('https://www.wixapis.com/stores-reader/v1/collections/query', {
    method: 'POST',
    headers: wixHeaders,
    body: JSON.stringify({ query: { paging: { limit: 100 } } }),
  })
  const data = (await res.json()) as { collections?: Array<{ id: string; slug?: string; name?: string }> }
  const map = new Map<string, string>()
  for (const c of data.collections ?? []) {
    const slug = resolveCategorySlug(c.slug ?? '', c.name ?? '')
    if (slug) map.set(c.id, slug)
  }
  return map
}

async function importProduct(
  product: WixProduct,
  categoryMap: Map<string, string>,
  wixIdToSlug: Map<string, string>,
  ofertasCollIds: Set<string>,
) {
  const slug = product.slug
  const collIds = (product.collectionIds ?? []).filter(
    (id) => id !== '00000000-000000-000000-000000000001',
  )

  let categoryId: string | null = null
  for (const id of collIds) {
    const catSlug = wixIdToSlug.get(id)
    if (catSlug && PRIMARY_CATEGORY_SLUGS.has(catSlug)) {
      categoryId = categoryMap.get(id) ?? null
      if (categoryId) break
    }
  }

  const rawPrice = parseFloat(String(product.priceData?.price ?? '0'))
  const discounted = parseFloat(String(product.priceData?.discountedPrice ?? String(rawPrice)))
  const price = discounted > 0 ? discounted : rawPrice
  const comparePrice =
    discounted < rawPrice
      ? rawPrice
      : product.priceData?.compareAtPrice
        ? parseFloat(String(product.priceData.compareAtPrice))
        : null

  const stock = product.stock?.trackQuantity
    ? (product.stock?.quantity ?? 0)
    : product.stock?.inStock !== false
      ? 99
      : 0

  const isOffer = collIds.some((id) => ofertasCollIds.has(id))

  console.log(`\n📦 ${product.name}`)
  console.log(`   slug: ${slug} | wix_id: ${product.id}`)

  if (DRY_RUN) {
    console.log('   [DRY RUN] se insertaría')
    return true
  }

  const imageUrls: string[] = []
  const mediaItems = product.media?.items ?? []
  for (let i = 0; i < mediaItems.length; i++) {
    const rawUrl = mediaItems[i]?.image?.url
    if (!rawUrl) continue
    const buf = await downloadBuffer(rawUrl)
    if (!buf) continue
    const publicUrl = await uploadImage(buf, slug, i + 1)
    if (publicUrl) imageUrls.push(publicUrl)
  }

  const { error: insertErr } = await supabase.from('products').insert({
    name: product.name,
    slug,
    description: stripHtml(product.description ?? ''),
    price,
    compare_at_price: comparePrice,
    stock,
    category_id: categoryId,
    images: imageUrls,
    tags: product.tags ?? [],
    is_active: product.visible !== false,
    is_offer: isOffer,
    wix_id: product.id,
  })

  if (insertErr) {
    console.error(`   ❌ ${insertErr.message}`)
    return false
  }

  console.log(`   ✅ insertado (${imageUrls.length} imágenes)`)
  return true
}

async function main() {
  console.log(`\n🚀 Importar productos Wix faltantes${DRY_RUN ? ' (DRY RUN)' : ''}\n`)

  const wix = await fetchAllWixProducts()
  const { data: sb } = await supabase.from('products').select('wix_id')
  const sbWixIds = new Set((sb ?? []).map((p) => p.wix_id).filter(Boolean))

  const missing = wix.filter((p) => !sbWixIds.has(p.id))
  console.log(`Wix: ${wix.length} | Supabase wix_id: ${sbWixIds.size} | Faltan: ${missing.length}`)

  if (missing.length === 0) {
    console.log('\n✅ No hay productos faltantes por wix_id.')
    return
  }

  const categoryMap = await buildCategoryMap()
  const wixIdToSlug = await fetchWixCollections()
  const ofertasCollIds = new Set(
    [...wixIdToSlug.entries()]
      .filter(([, slug]) => WIX_OFFER_COLLECTIONS.has(slug))
      .map(([id]) => id),
  )

  let ok = 0
  for (const p of missing) {
    const success = await importProduct(p, categoryMap, wixIdToSlug, ofertasCollIds)
    if (success) ok++
  }

  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })

  console.log(`\n✅ Importados: ${ok}/${missing.length}`)
  console.log(`   Total Supabase ahora: ${count ?? '?'}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
