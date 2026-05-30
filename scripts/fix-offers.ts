// ============================================================
// fix-offers.ts
// Corrige el estado actual de la base de datos:
//   - Usa la Wix API para encontrar qué productos están en
//     la colección "Nuestras Ofertas"
//   - Marca esos productos con is_offer = true
//   - Limpia is_offer = false en el resto
//   - Corrige category_id en productos que quedaron
//     erróneamente asignados a la categoría "ofertas"
//
// Uso:
//   npm run fix:offers
// ============================================================

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// ─── Cargar .env.local ───────────────────────────────────────
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const [key, ...vals] = line.split('=')
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
  }
}

const WIX_API_KEY  = process.env.WIX_API_KEY!
const WIX_SITE_ID  = process.env.WIX_SITE_ID ?? '0c8e6806-c437-4a19-914b-39f9ed9284c6'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!WIX_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Faltan variables de entorno. Revisa .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const wixHeaders = {
  Authorization: WIX_API_KEY,
  'wix-site-id': WIX_SITE_ID,
  'Content-Type': 'application/json',
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function main() {
  console.log('🔧 Iniciando corrección de ofertas...\n')

  // ── 1. Obtener colecciones de Wix ──────────────────────────
  const colRes = await fetch('https://www.wixapis.com/stores-reader/v1/collections/query', {
    method: 'POST',
    headers: wixHeaders,
    body: JSON.stringify({ query: { paging: { limit: 50 } } }),
  })

  if (!colRes.ok) {
    console.error('❌ Error al obtener colecciones de Wix:', await colRes.text())
    process.exit(1)
  }

  interface WixCollection { id: string; name: string }
  const colData = await colRes.json() as { collections: WixCollection[] }
  const collections = colData.collections ?? []

  // Colecciones que marcan un producto como oferta
  const OFFER_NAMES = new Set(['nuestras ofertas'])
  const offerCollIds = new Set(
    collections
      .filter(c => OFFER_NAMES.has(c.name.toLowerCase()))
      .map(c => c.id)
  )

  console.log(`📋 Colecciones "oferta" encontradas: ${[...offerCollIds].join(', ')}`)

  // ── 2. Obtener todos los productos de Wix ─────────────────
  interface WixProduct { id: string; name: string; slug?: string; collectionIds?: string[] }
  let allWixProducts: WixProduct[] = []
  let offset = 0
  while (true) {
    const res = await fetch('https://www.wixapis.com/stores-reader/v1/products/query', {
      method: 'POST',
      headers: wixHeaders,
      body: JSON.stringify({ query: { paging: { limit: 100, offset } } }),
    })
    if (!res.ok) break
    const data = await res.json() as { products: WixProduct[] }
    const batch = data.products ?? []
    allWixProducts = [...allWixProducts, ...batch]
    if (batch.length < 100) break
    offset += 100
  }

  console.log(`📦 Productos Wix obtenidos: ${allWixProducts.length}`)

  // ── 3. Separar slugs de "offer" vs "no offer" ─────────────
  const offerSlugs: string[] = []
  const noOfferSlugs: string[] = []

  for (const p of allWixProducts) {
    const slug = slugify(p.name)
    const isOffer = (p.collectionIds ?? []).some(id => offerCollIds.has(id))
    if (isOffer) {
      offerSlugs.push(slug)
      console.log(`  🏷️  Oferta: ${p.name} (${slug})`)
    } else {
      noOfferSlugs.push(slug)
    }
  }

  console.log(`\n✅ Productos marcados como oferta: ${offerSlugs.length}`)

  // ── 4. Actualizar is_offer en Supabase ────────────────────
  if (offerSlugs.length > 0) {
    const { error: errOn } = await supabase
      .from('products')
      .update({ is_offer: true })
      .in('slug', offerSlugs)

    if (errOn) console.error('❌ Error marcando is_offer=true:', errOn.message)
    else console.log(`  ✅ is_offer = true en ${offerSlugs.length} productos`)
  }

  if (noOfferSlugs.length > 0) {
    const { error: errOff } = await supabase
      .from('products')
      .update({ is_offer: false })
      .in('slug', noOfferSlugs)

    if (errOff) console.error('❌ Error marcando is_offer=false:', errOff.message)
    else console.log(`  ✅ is_offer = false en ${noOfferSlugs.length} productos`)
  }

  // ── 5. Corregir productos asignados erróneamente a la
  //       categoría "ofertas" (categoría ya no se usa) ────────
  const { data: ofertasCat } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'ofertas')
    .single()

  if (ofertasCat) {
    // Quitar category_id de cualquier producto que estaba en la categoría "ofertas"
    // (ya no se necesita, la página filtra por is_offer)
    const { count, error: errCat } = await supabase
      .from('products')
      .update({ category_id: null })
      .eq('category_id', ofertasCat.id)

    if (errCat) {
      console.error('❌ Error limpiando category_id "ofertas":', errCat.message)
    } else {
      console.log(`\n  ✅ category_id limpiado en ${count ?? 0} productos que tenían slug "ofertas"`)
    }
  } else {
    console.log('\n  ℹ️  No existe categoría "ofertas" en la base de datos (OK)')
  }

  console.log('\n🎉 Corrección completada.')
  console.log('   Recuerda correr la migración SQL antes de ejecutar este script:')
  console.log('   supabase/migrations/20260529_add_is_offer_column.sql')
}

main().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
