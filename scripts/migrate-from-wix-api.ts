// ============================================================
// migrate-from-wix-api.ts
// Migra productos, imágenes y blog desde la API de Wix
// a Supabase (DB + Storage)
//
// Uso:
//   npm run migrate:api
//
// Variables necesarias en .env.local:
//   WIX_API_KEY=tu_api_key_de_wix
//   WIX_SITE_ID=0c8e6806-c437-4a19-914b-39f9ed9284c6
//   NEXT_PUBLIC_SUPABASE_URL=...
//   SUPABASE_SERVICE_ROLE_KEY=...
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { loadEnvLocal } from './load-env-local'
import {
  PRIMARY_CATEGORY_SLUGS,
  WIX_OFFER_COLLECTIONS,
  resolveCategorySlug,
} from './wix-migration-config'
import { normalizeWixDescription } from '../src/lib/wix-description'
import { compressImageBuffer } from '../src/lib/utils/image-compress-server'

loadEnvLocal()

const WIX_API_KEY  = process.env.WIX_API_KEY!
const WIX_SITE_ID  = process.env.WIX_SITE_ID!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!WIX_API_KEY || !WIX_SITE_ID || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Faltan variables de entorno. Revisa .env.local')
  console.error('   Necesitas: WIX_API_KEY, WIX_SITE_ID, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  console.error('   Descubre WIX_SITE_ID con: npx tsx scripts/discover-wix-site.ts')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const wixHeaders: Record<string, string> = {
  'Authorization': WIX_API_KEY,
  'wix-site-id':   WIX_SITE_ID,
  'Content-Type':  'application/json',
}
if (process.env.WIX_ACCOUNT_ID) {
  wixHeaders['wix-account-id'] = process.env.WIX_ACCOUNT_ID
}

// ─── Helpers ───────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}

async function uploadImageToSupabase(
  buffer: Buffer,
  filename: string,
  folder: 'products' | 'blog'
): Promise<string | null> {
  const compressed = await compressImageBuffer(buffer)
  const base = filename.replace(/\.[^.]+$/, '')
  const finalName = `${base}.${compressed.extension}`

  const { data, error } = await supabase.storage
    .from('images')
    .upload(`${folder}/${finalName}`, compressed.buffer, {
      contentType: compressed.contentType,
      upsert: true,
    })

  if (error) {
    console.warn(`  ⚠️  Error subiendo imagen ${filename}:`, error.message)
    return null
  }

  const { data: publicUrl } = supabase.storage
    .from('images')
    .getPublicUrl(data.path)

  return publicUrl.publicUrl
}

// ─── 1. Migrar Productos ────────────────────────────────────

async function migrateProducts() {
  console.log('\n📦 Migrando productos desde Wix...')

  let allProducts: WixProduct[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const res = await fetch('https://www.wixapis.com/stores-reader/v1/products/query', {
      method: 'POST',
      headers: wixHeaders,
      body: JSON.stringify({ includeHiddenProducts: true, query: { paging: { limit, offset } } }),
    })

    if (!res.ok) {
      console.error('❌ Error al obtener productos de Wix:', await res.text())
      break
    }

    const data = await res.json() as { products: WixProduct[]; totalResults?: number }
    const products = data.products ?? []
    allProducts = [...allProducts, ...products]

    console.log(`  Obtenidos ${allProducts.length} productos...`)

    if (products.length < limit) break
    offset += limit
  }

  console.log(`  Total encontrado: ${allProducts.length} productos`)

  const ofertasCollIds = new Set<string>()

  // Obtener o crear categorías desde Wix
  const categoryMap   = new Map<string, string>() // wixCollectionId → supabase category id
  const wixIdToSlug   = new Map<string, string>() // wixCollectionId → slug usado

  // Insertar colecciones de Wix como categorías
  const collectionsRes = await fetch('https://www.wixapis.com/stores-reader/v1/collections/query', {
    method: 'POST',
    headers: wixHeaders,
    body: JSON.stringify({ query: { paging: { limit: 50 } } }),
  })

  if (collectionsRes.ok) {
    const colData = await collectionsRes.json() as { collections: WixCollection[] }
    for (const col of colData.collections ?? []) {
      if (col.name === 'All Products') continue

      const nameLower = col.name.toLowerCase()

      if (WIX_OFFER_COLLECTIONS.has(nameLower)) {
        ofertasCollIds.add(col.id)
        continue
      }

      const slug = resolveCategorySlug(col.name)
      if (!slug) continue

      wixIdToSlug.set(col.id, slug)

      const { data: existingCat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', slug)
        .single()

      if (existingCat) {
        categoryMap.set(col.id, existingCat.id)
        continue
      }

      const { data: newCat } = await supabase
        .from('categories')
        .insert({ name: col.name, slug })
        .select('id')
        .single()

      if (newCat) categoryMap.set(col.id, newCat.id)
    }
    console.log(`  ✅ ${categoryMap.size} categorías procesadas`)
  }

  // Insertar productos
  let migratedCount = 0
  let errorCount = 0

  for (const product of allProducts) {
    try {
      const slug = product.slug || slugify(product.name)

      // Bajar y subir imágenes; recopilar URLs de video
      const imageUrls: string[] = []
      const videoUrls: string[] = []
      for (const media of product.media?.items ?? []) {
        if (media.video?.files?.length) {
          // Elegir la mejor calidad disponible (720p preferido, luego 1080p, luego lo que haya)
          const files = media.video.files.filter((f) => f.url)
          const qualityOrder: Record<string, number> = { '720p': 3, '1080p': 2, '480p': 1 }
          const best = files.sort(
            (a, b) => (qualityOrder[b.quality ?? ''] ?? 0) - (qualityOrder[a.quality ?? ''] ?? 0)
          )[0]
          if (best?.url) videoUrls.push(best.url)
          continue
        }

        const imageUrl = media.image?.url ?? media.image?.id
        if (!imageUrl) continue

        const buffer = await downloadImage(imageUrl)
        if (!buffer) continue

        const filename = `${slug}-${imageUrls.length + 1}.jpg`
        const publicUrl = await uploadImageToSupabase(buffer, filename, 'products')
        if (publicUrl) imageUrls.push(publicUrl)
      }

      // Precio: discountedPrice es lo que el cliente paga; price es el tachado
      const rawPrice     = parseFloat(product.priceData?.price ?? '0')
      const discounted   = parseFloat(product.priceData?.discountedPrice ?? String(rawPrice))
      const price        = discounted > 0 ? discounted : rawPrice
      const comparePrice = discounted < rawPrice
        ? rawPrice
        : (product.priceData?.compareAtPrice
            ? parseFloat(product.priceData.compareAtPrice)
            : null)

      // Stock
      // Si Wix no rastrea cantidad exacta (trackQuantity=false), usa inStock como señal
      const stock = product.stock?.trackQuantity
        ? (product.stock?.quantity ?? 0)
        : (product.stock?.inStock !== false ? 99 : 0)

      // Categoría: solo colecciones primarias (mujeres / hombres)
      const collIds = (product.collectionIds ?? []).filter((id: string) => id !== '00000000-000000-000000-000000000001')
      let categoryId: string | null = null
      for (const id of collIds) {
        const slug = wixIdToSlug.get(id)
        if (slug && PRIMARY_CATEGORY_SLUGS.has(slug)) {
          categoryId = categoryMap.get(id) ?? null
          if (categoryId) break
        }
      }

      // is_offer: true si el producto pertenece a alguna colección de ofertas
      const isOffer = collIds.some((id: string) => ofertasCollIds.has(id))

      // Verificar si ya existe (por slug o por wix_id)
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

      // Payload base (no incluye wix_id — columna opcional; se agrega si existe)
      const basePayload = {
        name:             product.name,
        description:      normalizeWixDescription(product.description ?? ''),
        price,
        compare_at_price: comparePrice,
        stock,
        images:           imageUrls,
        videos:           videoUrls,
        category_id:      categoryId,
        is_offer:         isOffer,
        is_active:        product.visible ?? true,
      }

      if (existing) {
        const { error: updateErr } = await supabase
          .from('products')
          .update(basePayload)
          .eq('id', existing.id)
        if (updateErr) throw new Error(`update failed: ${updateErr.message}`)

        // Intentar setear wix_id (falla silenciosamente si la columna no existe aún)
        await supabase.from('products').update({ wix_id: product.id }).eq('id', existing.id)
      } else {
        const { error: insertErr } = await supabase.from('products').insert({
          ...basePayload,
          slug,
        })
        if (insertErr) throw new Error(`insert failed: ${insertErr.message}`)

        // Intentar setear wix_id en la fila recién insertada
        await supabase.from('products').update({ wix_id: product.id }).eq('slug', slug)
      }

      migratedCount++
      console.log(`  ✅ [${migratedCount}/${allProducts.length}] ${product.name}`)
    } catch (err) {
      errorCount++
      console.warn(`  ⚠️  Error con producto "${product.name}":`, err)
    }
  }

  console.log(`\n  Productos migrados: ${migratedCount} ✅  |  Errores: ${errorCount}`)

  await syncProductCategoriesAndOrder(categoryMap, wixIdToSlug, ofertasCollIds)
}

/** Vincula productos a todas sus categorías Wix y respeta el orden de cada colección */
async function syncProductCategoriesAndOrder(
  categoryMap: Map<string, string>,
  wixIdToSlug: Map<string, string>,
  ofertasCollIds: Set<string>,
) {
  console.log('\n📑 Sincronizando categorías múltiples y orden...')

  const slugToCatId = new Map<string, string>()
  for (const [wixId, catId] of categoryMap) {
    const slug = wixIdToSlug.get(wixId)
    if (slug) slugToCatId.set(slug, catId)
  }

  const { data: dbProducts } = await supabase
    .from('products')
    .select('id, slug, wix_id')

  const wixToDb = new Map(
    (dbProducts ?? []).filter((p) => p.wix_id).map((p) => [p.wix_id as string, p.id as string]),
  )

  const globalSort = new Map<string, number>()

  for (const [wixCollId, catId] of categoryMap) {
    const slug = wixIdToSlug.get(wixCollId)
    if (!slug) continue

    let offset = 0
    const limit = 100
    let sortIndex = 0

    while (true) {
      const res = await fetch('https://www.wixapis.com/stores-reader/v1/products/query', {
        method: 'POST',
        headers: wixHeaders,
        body: JSON.stringify({
          includeHiddenProducts: true,
          query: {
            filter: JSON.stringify({ 'collections.id': { $hasSome: [wixCollId] } }),
            paging: { limit, offset },
          },
        }),
      })

      if (!res.ok) {
        console.warn(`  ⚠️  No se pudo leer colección ${slug}:`, await res.text())
        break
      }

      const data = await res.json() as { products?: Array<{ id: string }> }
      const items = data.products ?? []
      if (items.length === 0) break

      for (const item of items) {
        const dbId = wixToDb.get(item.id)
        if (!dbId) continue

        await supabase.from('product_categories').upsert(
          { product_id: dbId, category_id: catId, sort_order: sortIndex },
          { onConflict: 'product_id,category_id' },
        )

        if ((slug === 'premium' || slug === 'hombres') && !globalSort.has(dbId)) {
          globalSort.set(dbId, slug === 'hombres' ? 1000 + sortIndex : sortIndex)
        }
        sortIndex++
      }

      if (items.length < limit) break
      offset += limit
    }

    console.log(`  ✅ Orden aplicado: ${slug}`)
  }

  // Categoría mujeres — productos de la sección "Lo que ellas aman" (sin colección Wix)
  const mujeresCat = slugToCatId.get('mujeres')
  if (mujeresCat) {
    const mujeresSlugs = [
      'booty-abs-legs-for-woman',
      'booty-abs-legs-for-woman-max',
      'mass-stack-for-women',
      'pink-protein-para-mujeres-abs-booty-legs',
      'pack-super-reductor-gluteos-y-piernas-grandes',
      'combo-beach-peach',
      'extreme-pink-kit',
      'pack-mujer-quemador',
    ]
    for (let i = 0; i < mujeresSlugs.length; i++) {
      const s = mujeresSlugs[i]
      const row = (dbProducts ?? []).find((p) => p.slug === s)
      if (row) {
        await supabase.from('product_categories').upsert(
          { product_id: row.id, category_id: mujeresCat, sort_order: i },
          { onConflict: 'product_id,category_id' },
        )
      }
    }
    console.log('  ✅ Sección mujeres vinculada')
  }

  // Orden global = catálogo Wix (products/query sin filtro)
  let allOffset = 0
  let allIndex = 0
  while (true) {
    const res = await fetch('https://www.wixapis.com/stores-reader/v1/products/query', {
      method: 'POST',
      headers: wixHeaders,
      body: JSON.stringify({
        includeHiddenProducts: true,
        query: { paging: { limit: 100, offset: allOffset } },
      }),
    })
    if (!res.ok) break
    const data = await res.json() as { products?: Array<{ id: string }> }
    const items = data.products ?? []
    if (items.length === 0) break
    for (const item of items) {
      const dbId = wixToDb.get(item.id)
      if (dbId) {
        await supabase.from('products').update({ sort_order: allIndex }).eq('id', dbId)
        allIndex++
      }
    }
    if (items.length < 100) break
    allOffset += 100
  }
  console.log(`  ✅ Orden global (catálogo): ${allIndex} productos`)
}

// ─── 2. Migrar Blog ─────────────────────────────────────────

async function migrateBlog() {
  console.log('\n📝 Migrando blog desde Wix...')

  const res = await fetch('https://www.wixapis.com/blog/v3/posts/query', {
    method: 'POST',
    headers: wixHeaders,
    body: JSON.stringify({
      query: { paging: { limit: 100 } },
    }),
  })

  if (!res.ok) {
    console.error('❌ Error al obtener posts del blog:', await res.text())
    return
  }

  const data = await res.json() as { posts: WixPost[] }
  const posts = data.posts ?? []
  console.log(`  Total encontrado: ${posts.length} posts`)

  let migratedCount = 0

  for (const post of posts) {
    try {
      const slug = post.slug ?? slugify(post.title)

      // Imagen de portada
      let coverImageUrl: string | null = null
      if (post.coverMedia?.image?.url) {
        const buffer = await downloadImage(post.coverMedia.image.url)
        if (buffer) {
          const filename = `${slug}-cover.jpg`
          coverImageUrl = await uploadImageToSupabase(buffer, filename, 'blog')
        }
      }

      const { data: existing } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', slug)
        .single()

      const postData = {
        title:        post.title,
        slug,
        excerpt:      post.excerpt ?? null,
        content:      post.content ?? post.richContent ?? '',
        cover_image:  coverImageUrl,
        is_published: post.status?.toUpperCase() !== 'DRAFT',
        published_at: post.firstPublishedDate ?? post.publishedDate ?? null,
      }

      if (existing) {
        await supabase.from('blog_posts').update(postData).eq('id', existing.id)
      } else {
        await supabase.from('blog_posts').insert(postData)
      }

      migratedCount++
      console.log(`  ✅ [${migratedCount}/${posts.length}] ${post.title}`)
    } catch (err) {
      console.warn(`  ⚠️  Error con post "${post.title}":`, err)
    }
  }

  console.log(`\n  Posts migrados: ${migratedCount} ✅`)
}

// ─── 3. Asegurar bucket en Supabase Storage ──────────────────

async function ensureStorageBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = (buckets ?? []).some((b) => b.name === 'images')

  if (!exists) {
    const { error } = await supabase.storage.createBucket('images', { public: true })
    if (error) {
      console.error('❌ Error creando bucket "images":', error.message)
      process.exit(1)
    }
    console.log('  ✅ Bucket "images" creado en Supabase Storage')
  } else {
    console.log('  ✅ Bucket "images" ya existe')
  }
}

// ─── Main ───────────────────────────────────────────────────

async function main() {
  console.log('🚀 Iniciando migración Wix → Supabase')
  console.log(`   Site ID: ${WIX_SITE_ID}`)
  console.log(`   Supabase: ${SUPABASE_URL}\n`)

  await ensureStorageBucket()
  await migrateProducts()
  await migrateBlog()

  console.log('\n🎉 Migración completada')
}

main().catch((err) => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})

// ─── Tipos de Wix ───────────────────────────────────────────

interface WixProduct {
  id:            string
  name:          string
  description?:  string
  visible?:      boolean
  collectionIds?: string[]
  priceData?: {
    price:             string
    discountedPrice?:  string
    compareAtPrice?:   string
  }
  stock?: {
    trackQuantity?: boolean
    inStock?:       boolean
    quantity?:      number
  }
  media?: {
    items: Array<{
      image?: { url?: string; id?: string }
      video?: {
        files?: Array<{
          url?: string
          format?: string
          quality?: string
        }>
      }
    }>
  }
}

interface WixCollection {
  id:   string
  name: string
}

interface WixPost {
  id:                string
  title:             string
  slug?:             string
  excerpt?:          string
  content?:          string
  richContent?:      string
  status:            string
  firstPublishedDate?: string
  publishedDate?:    string
  coverMedia?: {
    image?: { url?: string }
  }
}
