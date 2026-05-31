// ============================================================
// import-missing-products.ts
// Importa los 3 productos de Wix que faltan en Supabase:
//   - LEMONADE BCAA 2:1:1
//   - EMPIRE CREATINA MONOHIDRATADA PREMIUM
//   - EMPIRE L-GLUTAMINE PREMIUM
//
// Uso:
//   npm run import:missing-products               (ejecuta)
//   npm run import:missing-products -- --dry-run  (solo muestra, no escribe)
//
// Requisitos:
//   - .env.local con WIX_API_KEY, WIX_SITE_ID, WIX_ACCOUNT_ID,
//     NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ============================================================

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// ─── Cargar .env.local ───────────────────────────────────────
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const [key, ...vals] = line.split('=')
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
  }
}

const DRY_RUN       = process.argv.includes('--dry-run')
const WIX_API_KEY   = process.env.WIX_API_KEY!
const WIX_SITE_ID   = process.env.WIX_SITE_ID   ?? '0c8e6806-c437-4a19-914b-39f9ed9284c6'
const WIX_ACCOUNT_ID = process.env.WIX_ACCOUNT_ID ?? ''
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!WIX_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Faltan variables de entorno. Revisa .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const WIX_HEADERS: Record<string, string> = {
  'Content-Type':  'application/json',
  'Authorization': WIX_API_KEY,
  'wix-site-id':   WIX_SITE_ID,
}
if (WIX_ACCOUNT_ID) WIX_HEADERS['wix-account-id'] = WIX_ACCOUNT_ID

// ─── IDs de los 3 productos a importar ───────────────────────
const MISSING_IDS = [
  '7abca8f3-d7f3-e05e-46e2-d4320e366e97',  // LEMONADE BCAA 2:1:1
  '3ecca665-f6e9-b7cd-abeb-2d87efe423d2',  // EMPIRE CREATINA MONOHIDRATADA PREMIUM
  '92807848-571f-d698-1d22-68c69542a5fa',  // EMPIRE L-GLUTAMINE PREMIUM
]

// ─── Wix collection ID → Supabase category ID ────────────────
// Solo las 8 colecciones reales (excluye All Products)
const COLLECTION_TO_CATEGORY: Record<string, string> = {
  '8a8b53df-9c7d-43b3-0738-b26872d1d77a': 'cde9ba69-bb40-49e5-afbd-ee5cca86131c', // Best Sellers
  '323a0c82-f6b2-dd1b-1c4b-6614e738da1c': 'bed625e8-092b-490d-8d88-c3ae9d3b49b2', // Favoritos de ellas
  '8281cb1d-8fa3-9b90-197d-bbe7fe562c89': '2a395d9d-b08f-47f4-89e1-2831613349eb', // Lo Más Vendido
  '184d49b2-b2af-920a-8660-c15003bcab3e': 'fa7a76af-6241-49c2-a849-65eea9a710f1', // Men Nutrition
  'c6079d79-30bd-251b-8c0a-2e5ae2894108': 'fb9ab1ab-c6a4-42d8-b648-19af1525a67b', // Nuestras Ofertas
  'b38c20d2-b7b0-34da-e3f4-3a9c8dfde91a': '2a5777ff-a0a9-4a43-9113-6b7b94a26cd7', // Suplementos
  '0982c35c-11a1-729d-fc9d-09464dcf81b7': 'd69ed673-1f82-4ecf-b250-44d29094482c', // Varones
  'aba03e1f-ec49-bfce-a3ef-91a55f417ea1': 'ce1d4d02-1d13-451a-a163-2acd8e4dceef', // Women's nutrition
}
const ALL_PRODUCTS_ID = '00000000-000000-000000-000000000001'

function pickCategory(collectionIds: string[]): string | null {
  for (const id of collectionIds) {
    if (id === ALL_PRODUCTS_ID) continue
    if (COLLECTION_TO_CATEGORY[id]) return COLLECTION_TO_CATEGORY[id]
  }
  return null
}

// ─── Helpers ─────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

async function downloadBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`  ⚠️  No se pudo descargar ${url.slice(0, 80)} (HTTP ${res.status})`)
      return null
    }
    return Buffer.from(await res.arrayBuffer())
  } catch (err) {
    console.warn(`  ⚠️  Error descargando imagen:`, err)
    return null
  }
}

async function uploadImage(buffer: Buffer, slug: string, index: number): Promise<string | null> {
  const storagePath = `products/${slug}-${index}.jpg`
  const { data, error } = await supabase.storage
    .from('images')
    .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true })

  if (error) {
    console.warn(`  ⚠️  Error subiendo ${storagePath}:`, error.message)
    return null
  }

  const { data: pub } = supabase.storage.from('images').getPublicUrl(data.path)
  return pub.publicUrl
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚀 Import missing products${DRY_RUN ? ' (DRY RUN)' : ''}\n`)

  for (const wixId of MISSING_IDS) {
    console.log(`\n📦 Fetching product ${wixId}...`)

    const res = await fetch(`https://www.wixapis.com/stores-reader/v1/products/${wixId}`, {
      headers: WIX_HEADERS,
    })
    if (!res.ok) {
      console.error(`  ❌ Error ${res.status} fetching product ${wixId}`)
      continue
    }

    const { product: p } = await res.json() as { product: WixProduct }

    const categoryId = pickCategory(p.collectionIds ?? [])
    const price      = parseFloat(String(p.priceData?.price ?? p.price ?? 0))
    const compareAt  = p.priceData?.compareAtPrice ? parseFloat(String(p.priceData.compareAtPrice)) : null
    const desc       = stripHtml(p.description ?? '')
    const isActive   = p.visible !== false

    console.log(`  name:        ${p.name}`)
    console.log(`  slug:        ${p.slug}`)
    console.log(`  price:       ${price}`)
    console.log(`  compareAt:   ${compareAt}`)
    console.log(`  visible:     ${isActive}`)
    console.log(`  category_id: ${categoryId ?? 'NULL'}`)
    console.log(`  collections: ${(p.collectionIds ?? []).join(', ')}`)
    console.log(`  numImages:   ${p.media?.items?.length ?? 0}`)

    // Check if slug already exists in SB (avoid collision)
    const { data: existing } = await supabase
      .from('products')
      .select('id, slug')
      .eq('slug', p.slug)
      .maybeSingle()

    if (existing) {
      console.warn(`  ⚠️  Slug "${p.slug}" ya existe en SB (id: ${existing.id}). Saltando.`)
      continue
    }

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Se insertaría con ${p.media?.items?.length ?? 0} imágenes`)
      continue
    }

    // Upload images
    const imageUrls: string[] = []
    const mediaItems = p.media?.items ?? []

    for (let i = 0; i < mediaItems.length; i++) {
      const item = mediaItems[i]
      const rawUrl = item.image?.url
      if (!rawUrl) continue

      // Wix may return wix:image:// URIs — resolve to https
      let url = rawUrl
      if (url.startsWith('wix:image://')) {
        const fileId = url.replace('wix:image://v1/', '').split('/')[0].split('#')[0]
        url = `https://static.wixstatic.com/media/${fileId}`
      }

      process.stdout.write(`  📥 Imagen ${i + 1}/${mediaItems.length} ...`)
      const buf = await downloadBuffer(url)
      if (!buf) continue

      const publicUrl = await uploadImage(buf, p.slug, i + 1)
      if (publicUrl) {
        imageUrls.push(publicUrl)
        process.stdout.write(` ✅\n`)
      } else {
        process.stdout.write(` ❌\n`)
      }
    }

    console.log(`  📸 Imágenes subidas: ${imageUrls.length}`)

    // Insert product
    const { error: insertErr } = await supabase.from('products').insert({
      name:             p.name,
      slug:             p.slug,
      description:      desc,
      price,
      compare_at_price: compareAt,
      stock:            (p.stock?.quantity ?? 0),
      category_id:      categoryId,
      images:           imageUrls,
      tags:             p.tags ?? [],
      is_active:        isActive,
      is_offer:         false,
      wix_id:           p.id,
    })

    if (insertErr) {
      console.error(`  ❌ Error insertando producto:`, insertErr.message)
    } else {
      console.log(`  ✅ Producto insertado: "${p.name}"`)
    }
  }

  console.log('\n✅ Import completo.')
}

main().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})

// ─── Tipos ───────────────────────────────────────────────────

interface WixImage {
  url?: string
  id?:  string
}

interface WixMediaItem {
  image?:     WixImage
  mediaType?: string
}

interface WixMedia {
  mainMedia?: WixMediaItem
  items?:     WixMediaItem[]
}

interface WixProduct {
  id:              string
  name:            string
  slug:            string
  description?:    string
  visible?:        boolean
  price?:          number | string
  priceData?: {
    price?:          number | string
    compareAtPrice?: number | string
  }
  collectionIds?:  string[]
  media?:          WixMedia
  tags?:           string[]
  stock?: {
    quantity?: number
    trackInventory?: boolean
  }
}
