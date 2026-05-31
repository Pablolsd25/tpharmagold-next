// ============================================================
// migrate-category-images.ts
// Descarga las imágenes de cada colección de Wix y las sube
// a Supabase Storage → actualiza categories.image_url
//
// Uso:
//   npm run migrate:categories            (ejecuta)
//   npm run migrate:categories -- --dry-run (solo muestra lo que haría)
//
// Variables necesarias en .env.local:
//   WIX_API_KEY
//   WIX_SITE_ID
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
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

const DRY_RUN     = process.argv.includes('--dry-run')
const WIX_API_KEY = process.env.WIX_API_KEY!
const WIX_SITE_ID = process.env.WIX_SITE_ID ?? '0c8e6806-c437-4a19-914b-39f9ed9284c6'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!WIX_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Faltan variables de entorno. Revisa .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const wixHeaders = {
  Authorization: WIX_API_KEY,
  'wix-site-id':  WIX_SITE_ID,
  'Content-Type': 'application/json',
}

// ─── Mapa Wix collection ID → Supabase category ID ───────────
// Mapeo directo por ID para evitar problemas de nombre/slug
const WIX_COLL_TO_CAT_ID: Record<string, string> = {
  '8a8b53df-9c7d-43b3-0738-b26872d1d77a': 'cde9ba69-bb40-49e5-afbd-ee5cca86131c', // Best Sellers
  '323a0c82-f6b2-dd1b-1c4b-6614e738da1c': 'bed625e8-092b-490d-8d88-c3ae9d3b49b2', // Favoritos de ellas
  '8281cb1d-8fa3-9b90-197d-bbe7fe562c89': '2a395d9d-b08f-47f4-89e1-2831613349eb', // Lo Más Vendido
  '184d49b2-b2af-920a-8660-c15003bcab3e': 'fa7a76af-6241-49c2-a849-65eea9a710f1', // Men Nutrition
  'c6079d79-30bd-251b-8c0a-2e5ae2894108': 'fb9ab1ab-c6a4-42d8-b648-19af1525a67b', // Nuestras Ofertas
  'b38c20d2-b7b0-34da-e3f4-3a9c8dfde91a': '2a5777ff-a0a9-4a43-9113-6b7b94a26cd7', // Suplementos
  '0982c35c-11a1-729d-fc9d-09464dcf81b7': 'd69ed673-1f82-4ecf-b250-44d29094482c', // Varones
  'aba03e1f-ec49-bfce-a3ef-91a55f417ea1': 'ce1d4d02-1d13-451a-a163-2acd8e4dceef', // Women's nutrition
}
const ALL_PRODUCTS_COLL = '00000000-000000-000000-000000000001'

// ─── Helpers ─────────────────────────────────────────────────

async function resolveWixImageUrl(raw: string): Promise<string | null> {
  // Wix puede devolver una URL directa o un wix:image:// URI
  if (raw.startsWith('http')) return raw

  if (raw.startsWith('wix:image://')) {
    // Formato: wix:image://v1/<fileId>/<filename>#originWidth=...
    const withoutScheme = raw.replace('wix:image://v1/', '')
    const fileId = withoutScheme.split('/')[0].split('#')[0]
    // URL pública de imagen estática de Wix
    return `https://static.wixstatic.com/media/${fileId}`
  }

  // Puede ser un fileId directo
  if (!raw.includes('/') && !raw.includes('.')) {
    return `https://static.wixstatic.com/media/${raw}`
  }

  return raw
}

async function downloadBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`  ⚠️  No se pudo descargar ${url} (HTTP ${res.status})`)
      return null
    }
    return Buffer.from(await res.arrayBuffer())
  } catch (err) {
    console.warn(`  ⚠️  Error descargando ${url}:`, err)
    return null
  }
}

async function uploadToSupabase(buffer: Buffer, slug: string): Promise<string | null> {
  const storagePath = `categories/${slug}.jpg`
  const { data, error } = await supabase.storage
    .from('images')
    .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true })

  if (error) {
    console.warn(`  ⚠️  Error subiendo imagen de categoría "${slug}":`, error.message)
    return null
  }

  const { data: pub } = supabase.storage.from('images').getPublicUrl(data.path)
  return pub.publicUrl
}

// ─── Extraer URL de imagen de un objeto media de Wix ─────────
// La API de colecciones puede devolver distintas formas:
//   col.media.mainMedia.image.url
//   col.media.items[0].image.url
//   col.media.items[0].image.id  (wix:image:// URI)
function extractImageUrl(media: WixMedia | undefined): string | null {
  if (!media) return null

  const main = media.mainMedia
  if (main?.image?.url) return main.image.url
  if (main?.image?.id)  return main.image.id

  const first = media.items?.[0]
  if (first?.image?.url) return first.image.url
  if (first?.image?.id)  return first.image.id

  return null
}

async function main() {
  console.log(`🚀 Migración de imágenes de categorías${DRY_RUN ? ' (DRY RUN)' : ''}`)
  console.log(`   Site ID: ${WIX_SITE_ID}\n`)

  // 1. Obtener colecciones de Wix
  const res = await fetch('https://www.wixapis.com/stores-reader/v1/collections/query', {
    method: 'POST',
    headers: wixHeaders,
    body: JSON.stringify({ query: { paging: { limit: 50 } } }),
  })

  if (!res.ok) {
    console.error('❌ Error al obtener colecciones de Wix:', await res.text())
    process.exit(1)
  }

  const colData = await res.json() as { collections: WixCollection[] }
  const collections = colData.collections ?? []
  console.log(`📋 Colecciones encontradas en Wix: ${collections.length}`)

  // 2. Obtener categorías actuales de Supabase
  const { data: categories, error: catErr } = await supabase
    .from('categories')
    .select('id, slug, name, image_url')

  if (catErr) {
    console.error('❌ Error al obtener categorías de Supabase:', catErr.message)
    process.exit(1)
  }

  const catById = new Map(categories!.map(c => [c.id, c]))
  console.log(`📋 Categorías en Supabase: ${categories!.length}\n`)

  // 3. Procesar cada colección
  let updated = 0
  let skipped = 0

  for (const col of collections) {
    if (col.id === ALL_PRODUCTS_COLL) { skipped++; continue }

    const catId = WIX_COLL_TO_CAT_ID[col.id]
    if (!catId) {
      console.warn(`  ⚠️  Colección sin mapeo: "${col.name}" (${col.id})`)
      skipped++
      continue
    }

    const cat = catById.get(catId)
    if (!cat) {
      console.warn(`  ⚠️  Categoría no encontrada en SB para id "${catId}" (colección "${col.name}")`)
      skipped++
      continue
    }

    const rawUrl = extractImageUrl(col.media)
    if (!rawUrl) {
      console.warn(`  ⚠️  Colección "${col.name}" no tiene imagen en Wix`)
      skipped++
      continue
    }

    const resolvedUrl = await resolveWixImageUrl(rawUrl)
    if (!resolvedUrl) {
      console.warn(`  ⚠️  No se pudo resolver la URL de imagen para "${col.name}"`)
      skipped++
      continue
    }

    console.log(`📥 "${col.name}" (${cat.slug}) → ${resolvedUrl.slice(0, 80)}...`)

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Se subiría a images/categories/${cat.slug}.jpg`)
      updated++
      continue
    }

    const buffer = await downloadBuffer(resolvedUrl)
    if (!buffer) { skipped++; continue }

    const publicUrl = await uploadToSupabase(buffer, cat.slug)
    if (!publicUrl) { skipped++; continue }

    const { error: updateErr } = await supabase
      .from('categories')
      .update({ image_url: publicUrl })
      .eq('id', cat.id)

    if (updateErr) {
      console.warn(`  ❌ Error actualizando image_url para "${cat.slug}":`, updateErr.message)
      skipped++
      continue
    }

    console.log(`  ✅ Actualizado: ${publicUrl}`)
    updated++
  }

  console.log(`\n🎉 Completado | Actualizadas: ${updated} | Saltadas: ${skipped}`)

  if (updated === 0 && !DRY_RUN) {
    console.log('\n💡 Si Wix no devolvió imágenes para las colecciones, puedes subir')
    console.log('   las imágenes manualmente desde /admin/categorias en el editor de cada categoría.')
  }
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

interface WixCollection {
  id:    string
  name:  string
  media?: WixMedia
}
