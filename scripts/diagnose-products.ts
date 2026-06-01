import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const [key, ...vals] = line.split('=')
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const WIX_HEADERS = {
  'Authorization': process.env.WIX_API_KEY!,
  'wix-site-id': process.env.WIX_SITE_ID!,
  'Content-Type': 'application/json',
}

async function main() {
  console.log('🔍 Diagnóstico de productos Wix vs Supabase\n')

  // 1. Obtener todas las categorías de Supabase
  const { data: categories } = await supabase.from('categories').select('*')
  console.log('📂 Categorías en Supabase:')
  categories?.forEach(c => {
    console.log(`  - ${c.name} (slug: ${c.slug}, id: ${c.id})`)
  })

  // 2. Obtener la categoría women-s-nutrition
  const { data: womenCat } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', 'women-s-nutrition')
    .single()

  console.log(`\nCategoría women-s-nutrition: ${womenCat ? '✅ EXISTE' : '❌ NO EXISTE'}`)
  if (womenCat) {
    console.log(`  ID: ${womenCat.id}`)
    console.log(`  Name: ${womenCat.name}`)
  }

  // 3. Obtener productos de Wix
  const wr = await fetch('https://www.wixapis.com/stores-reader/v1/products/query', {
    method: 'POST',
    headers: WIX_HEADERS,
    body: JSON.stringify({ includeHiddenProducts: true, query: { paging: { limit: 100 } } }),
  })

  if (!wr.ok) {
    console.error('❌ Error obteniendo productos de Wix:', await wr.text())
    return
  }

  const wj = await wr.json() as { products: any[] }
  const wixProducts = wj.products ?? []

  console.log(`\n📦 Productos en Wix: ${wixProducts.length}`)

  // 4. Obtener productos de Supabase
  const { data: sbProducts } = await supabase.from('products').select('id, name, wix_id, category_id, is_active')
  console.log(`📦 Productos en Supabase: ${sbProducts?.length || 0}`)

  // 5. Obtener colecciones de Wix
  const cr = await fetch('https://www.wixapis.com/stores-reader/v1/collections/query', {
    method: 'POST',
    headers: WIX_HEADERS,
    body: JSON.stringify({ query: { paging: { limit: 50 } } }),
  })

  if (cr.ok) {
    const cj = await cr.json() as { collections: any[] }
    const collections = cj.collections ?? []
    console.log(`\n📁 Colecciones en Wix: ${collections.length}`)
    collections.forEach(c => {
      console.log(`  - ${c.name} (id: ${c.id})`)
    })

    // 6. Productos en Wix con Women's nutrition
    const womenNutritionColl = collections.find(c => c.name.toLowerCase().includes('women'))
    if (womenNutritionColl) {
      console.log(`\nColección Women's nutrition ID: ${womenNutritionColl.id}`)
      const womenProducts = wixProducts.filter(p => p.collectionIds?.includes(womenNutritionColl.id))
      console.log(`Productos en Wix con Women's nutrition: ${womenProducts.length}`)
      womenProducts.forEach(p => console.log(`  - ${p.name}`))
    }
  }

  // 7. Productos en Supabase con women-s-nutrition category
  if (womenCat) {
    const { data: womenProducts } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', womenCat.id)
    console.log(`\nProductos en Supabase con category_id=${womenCat.id}: ${womenProducts?.length || 0}`)
    womenProducts?.forEach(p => {
      console.log(`  - ${p.name} (is_active: ${p.is_active}, wix_id: ${p.wix_id || 'NULL'})`)
    })
  }

  // 8. Verificar productos faltantes
  const expectedProducts = [
    'SUPER PEACH',
    'SEXY PEACH',
    'PINK KIT',
    'BARBIE FIT',
    'EXTREME PINK KIT',
    'SWEET BOO',
    'PEACH + SUMMER BODY',
    'PEACH + GLOW',
    'GLOW PROTEIN',
    'ALL STARS',
    'SUMMER BODY',
    'EMPIRE CREATINA',
    'EMPIRE GLUTAMINA',
    'BCAAS',
    'PREWORK',
  ]

  const sbNames = new Set(sbProducts?.map(p => p.name.toUpperCase()) || [])
  const missing = expectedProducts.filter(name => !sbNames.has(name))
  console.log(`\n❌ Productos faltantes en Supabase: ${missing.length}`)
  missing.forEach(name => console.log(`  - ${name}`))
}

main().catch(console.error)
