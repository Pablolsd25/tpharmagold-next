// ============================================================
// reupload-images.ts
// Re-sube imágenes ya existentes en la DB de Supabase que
// todavía apuntan a URLs de Wix (wixstatic.com / wix.com)
// y las reemplaza con URLs del bucket propio en Supabase Storage.
//
// Útil si ya migraste productos pero las imágenes siguen
// siendo URLs de Wix (que pueden expirar o ser bloqueadas).
//
// Uso:
//   npm run migrate:images
//   npm run migrate:images -- --dry-run   (muestra qué haría sin cambiar nada)
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { compressImageBuffer } from '../src/lib/utils/image-compress-server'
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Faltan: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase  = createClient(SUPABASE_URL, SUPABASE_KEY)
const isDryRun  = process.argv.includes('--dry-run')

// Dominios que se consideran "externos" y se deben re-alojar
const EXTERNAL_DOMAINS = [
  'wixstatic.com',
  'wix.com',
  'static.wixstatic.com',
  'images-wixmp',
]

function isExternalUrl(url: string): boolean {
  return EXTERNAL_DOMAINS.some((d) => url.includes(d))
}

function slugFromUrl(url: string, index: number): string {
  try {
    const u    = new URL(url)
    const base = path.basename(u.pathname).replace(/\.[^.]+$/, '')
    return `${base}-${index}`.replace(/[^a-z0-9-]/gi, '-').toLowerCase()
  } catch {
    return `image-${Date.now()}-${index}`
  }
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) })
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}

async function uploadToStorage(buffer: Buffer, filename: string): Promise<string | null> {
  const compressed = await compressImageBuffer(buffer)
  const base = filename.replace(/\.[^.]+$/, '')
  const finalName = `${base}.${compressed.extension}`

  const { data, error } = await supabase.storage
    .from('images')
    .upload(`products/${finalName}`, compressed.buffer, {
      contentType: compressed.contentType,
      upsert:      true,
    })

  if (error) {
    console.warn(`    ⚠️  Upload fallido (${filename}):`, error.message)
    return null
  }

  const { data: pub } = supabase.storage.from('images').getPublicUrl(data.path)
  return pub.publicUrl
}

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (!(buckets ?? []).some((b) => b.name === 'images')) {
    await supabase.storage.createBucket('images', { public: true })
    console.log('  ✅ Bucket "images" creado')
  }
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  console.log(`🖼️  Re-upload de imágenes Wix → Supabase Storage${isDryRun ? ' (DRY RUN)' : ''}`)
  console.log(`   Supabase: ${SUPABASE_URL}\n`)

  await ensureBucket()

  // Traer todos los productos con imágenes externas
  const { data: products, error } = await supabase
    .from('products')
    .select('id, slug, images')

  if (error) {
    console.error('❌ Error leyendo productos:', error.message)
    process.exit(1)
  }

  const toProcess = (products ?? []).filter(
    (p) => (p.images ?? []).some((url: string) => isExternalUrl(url))
  )

  console.log(`  Productos con imágenes externas: ${toProcess.length}`)

  if (toProcess.length === 0) {
    console.log('  ✅ No hay imágenes externas pendientes. ¡Todo en orden!')
    return
  }

  let updatedProducts = 0
  let totalImages     = 0
  let failedImages    = 0

  for (const product of toProcess) {
    const newImages: string[] = []
    let changed = false

    for (let i = 0; i < (product.images as string[]).length; i++) {
      const url = product.images[i] as string

      if (!isExternalUrl(url)) {
        newImages.push(url)
        continue
      }

      if (isDryRun) {
        console.log(`  [DRY] ${product.slug} → img[${i}]: ${url.substring(0, 60)}...`)
        newImages.push(url)
        totalImages++
        continue
      }

      console.log(`  Descargando: ${url.substring(0, 70)}...`)
      const buffer = await downloadImage(url)

      if (!buffer) {
        console.warn(`    ⚠️  No se pudo descargar. Se conserva URL original.`)
        newImages.push(url)
        failedImages++
        continue
      }

      const filename = `${product.slug}-${slugFromUrl(url, i)}.jpg`
      const newUrl   = await uploadToStorage(buffer, filename)

      if (newUrl) {
        console.log(`    ✅ Subida: ${newUrl}`)
        newImages.push(newUrl)
        totalImages++
        changed = true
      } else {
        newImages.push(url)
        failedImages++
      }
    }

    if (changed && !isDryRun) {
      const { error: updateErr } = await supabase
        .from('products')
        .update({ images: newImages })
        .eq('id', product.id)

      if (updateErr) {
        console.warn(`  ⚠️  Error actualizando "${product.slug}":`, updateErr.message)
      } else {
        updatedProducts++
        console.log(`  ✅ Producto actualizado: ${product.slug}`)
      }
    }
  }

  console.log(`\n🎉 Resultado:`)
  console.log(`   Productos actualizados : ${updatedProducts}`)
  console.log(`   Imágenes migradas      : ${totalImages}`)
  if (failedImages) console.log(`   Imágenes fallidas      : ${failedImages} ⚠️`)
}

main().catch((e) => { console.error('❌', e); process.exit(1) })
