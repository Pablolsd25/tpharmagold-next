// ============================================================
// migrate-from-csv.ts
// Importa productos desde el CSV exportado de Wix Stores
// y sube las imágenes a Supabase Storage.
//
// Cómo exportar el CSV de Wix:
//   Dashboard Wix → Tienda → Productos → ••• → Exportar productos
//
// Uso:
//   npm run migrate:csv -- --file=wix-products.csv
//
// Variables necesarias en .env.local:
//   NEXT_PUBLIC_SUPABASE_URL=...
//   SUPABASE_SERVICE_ROLE_KEY=...
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse/sync'
import * as fs from 'fs'
import * as path from 'path'

// ─── Cargar .env.local ──────────────────────────────────────
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
  console.error('❌ Faltan variables: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ─── Argumento --file ────────────────────────────────────────
const fileArg = process.argv.find((a) => a.startsWith('--file='))
const csvPath = fileArg ? path.resolve(process.cwd(), fileArg.replace('--file=', '')) : null

if (!csvPath || !fs.existsSync(csvPath)) {
  console.error('❌ Debes indicar el archivo CSV: npm run migrate:csv -- --file=wix-products.csv')
  process.exit(1)
}

// ─── Helpers ────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}

async function uploadImage(buffer: Buffer, filename: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('images')
    .upload(`products/${filename}`, buffer, { contentType: 'image/jpeg', upsert: true })

  if (error) {
    console.warn(`    ⚠️  Imagen no subida (${filename}):`, error.message)
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

async function getOrCreateCategory(name: string): Promise<string | null> {
  if (!name?.trim()) return null
  const slug = slugify(name)

  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) return existing.id

  const { data: created } = await supabase
    .from('categories')
    .insert({ name: name.trim(), slug })
    .select('id')
    .single()

  return created?.id ?? null
}

// ─── Columnas que exporta Wix (nombres exactos del CSV) ─────
//
//  handleId | fieldType | field1 | field2 | field3 | ...
//  (formato columnar de Wix, no fila-por-producto)
//
// También soporta el formato simple:
//  Name | Description | Price | Compare At Price | Visible | Category |
//  productImageUrl | ...

interface WixCsvRow {
  [key: string]: string
}

function parsePrice(val: string): number {
  if (!val) return 0
  const n = parseFloat(val.replace(/[^0-9.]/g, ''))
  return isNaN(n) ? 0 : n
}

// ─── Detectar formato del CSV ─────────────────────────────────

function detectFormat(headers: string[]): 'columnar' | 'flat' {
  // Formato columnar de Wix: primera columna es "handleId" y segunda "fieldType"
  if (headers[0]?.toLowerCase() === 'handleid' || headers[1]?.toLowerCase() === 'fieldtype') {
    return 'columnar'
  }
  return 'flat'
}

// ─── Parsear formato columnar de Wix ─────────────────────────
// Wix exporta un CSV donde cada "producto" ocupa múltiples filas
// según el tipo de campo (Product, Media, etc.)

interface ParsedProduct {
  name:          string
  description:   string
  price:         number
  comparePrice:  number | null
  sku:           string
  visible:       boolean
  category:      string
  imageUrls:     string[]
  stock:         number
}

function parseColumnar(rows: WixCsvRow[]): ParsedProduct[] {
  const productMap = new Map<string, ParsedProduct>()

  for (const row of rows) {
    const handleId   = row['handleId']   ?? row['Handle']   ?? ''
    const fieldType  = row['fieldType']  ?? row['FieldType'] ?? ''

    if (!handleId) continue

    if (fieldType === 'Product' || fieldType === '') {
      const name       = row['name']         ?? row['Name']        ?? handleId
      const price      = parsePrice(row['price']        ?? row['Price']       ?? '0')
      const compareAt  = row['discountedPrice'] ?? row['CompareAtPrice'] ?? row['compareAtPrice'] ?? ''
      const stock      = parseInt(row['inventory'] ?? row['Stock'] ?? '0', 10) || 0

      productMap.set(handleId, {
        name,
        description:  row['description'] ?? row['Description'] ?? '',
        price,
        comparePrice: compareAt ? parsePrice(compareAt) : null,
        sku:          row['sku'] ?? row['SKU'] ?? '',
        visible:      (row['visible'] ?? row['Visible'] ?? 'TRUE').toLowerCase() !== 'false',
        category:     row['collection'] ?? row['Collection'] ?? row['Category'] ?? '',
        imageUrls:    [],
        stock,
      })
    } else if (fieldType === 'MediaItem' || fieldType === 'Media') {
      const product = productMap.get(handleId)
      if (!product) continue

      const url = row['mediaUrl'] ?? row['MediaUrl'] ?? row['imageUrl'] ?? ''
      if (url) product.imageUrls.push(url)
    }
  }

  return Array.from(productMap.values())
}

function parseFlat(rows: WixCsvRow[]): ParsedProduct[] {
  return rows.map((row) => {
    const imageUrls: string[] = []

    // Wix a veces pone múltiples columnas: imageUrl, imageUrl2, imageUrl3...
    for (const key of Object.keys(row)) {
      const lk = key.toLowerCase()
      if ((lk.includes('image') || lk.includes('media')) && row[key]?.startsWith('http')) {
        imageUrls.push(row[key])
      }
    }

    return {
      name:         row['Name']        ?? row['name']        ?? '',
      description:  row['Description'] ?? row['description'] ?? '',
      price:        parsePrice(row['Price'] ?? row['price'] ?? '0'),
      comparePrice: row['Compare At Price'] ?? row['compareAtPrice']
        ? parsePrice(row['Compare At Price'] ?? row['compareAtPrice'])
        : null,
      sku:          row['SKU'] ?? row['sku'] ?? '',
      visible:      (row['Visible'] ?? row['visible'] ?? 'true').toLowerCase() !== 'false',
      category:     row['Category'] ?? row['category'] ?? row['Collection'] ?? '',
      imageUrls,
      stock:        parseInt(row['Stock'] ?? row['inventory'] ?? '0', 10) || 0,
    }
  }).filter((p) => p.name)
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Migración desde CSV → Supabase')
  console.log(`   Archivo: ${csvPath}\n`)

  await ensureBucket()

  // Parsear CSV
  const raw = fs.readFileSync(csvPath!, 'utf-8')
  const rows: WixCsvRow[] = parse(raw, {
    columns:          true,
    skip_empty_lines: true,
    trim:             true,
    bom:              true,
  })

  console.log(`  Filas leídas: ${rows.length}`)

  const headers      = Object.keys(rows[0] ?? {})
  const format       = detectFormat(headers)
  const products     = format === 'columnar' ? parseColumnar(rows) : parseFlat(rows)

  console.log(`  Formato detectado: ${format}`)
  console.log(`  Productos encontrados: ${products.length}\n`)

  let ok = 0, err = 0

  for (const product of products) {
    try {
      const slug = slugify(product.name)
      const categoryId = await getOrCreateCategory(product.category)

      // Subir imágenes
      const uploadedUrls: string[] = []
      for (let i = 0; i < product.imageUrls.length; i++) {
        const url = product.imageUrls[i]
        if (!url) continue
        const buffer = await downloadImage(url)
        if (!buffer) { uploadedUrls.push(url); continue }  // usa URL original si falla la descarga
        const filename = `${slug}-${i + 1}.jpg`
        const pub = await uploadImage(buffer, filename)
        uploadedUrls.push(pub ?? url)
      }

      const payload = {
        name:             product.name,
        slug,
        description:      product.description || null,
        price:            product.price,
        compare_at_price: product.comparePrice,
        stock:            product.stock,
        images:           uploadedUrls,
        category_id:      categoryId,
        is_active:        product.visible,
      }

      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .single()

      if (existing) {
        await supabase.from('products').update(payload).eq('id', existing.id)
      } else {
        await supabase.from('products').insert(payload)
      }

      ok++
      console.log(`  ✅ [${ok}/${products.length}] ${product.name} (${uploadedUrls.length} imgs)`)
    } catch (e) {
      err++
      console.warn(`  ⚠️  Error: "${product.name}":`, e)
    }
  }

  console.log(`\n🎉 Listo. Migrados: ${ok} ✅  |  Errores: ${err}`)
}

main().catch((e) => { console.error('❌', e); process.exit(1) })
