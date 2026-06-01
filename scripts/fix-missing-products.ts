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
  console.log('🔍 Buscando productos faltantes en Supabase\n')

  // Productos faltantes según el diagnóstico
  const missing = [
    'BARBIE FIT - DESTRUCTOR DE GRASA',
    '¡¡SWEET BOO!! (MÁS CURVAS NATURALES)',
    'SUMMERBODY -EXTRAQUEMA DE GRASA EN EL ENTRENAMIENTO',
    'EMPIRE L-GLUTAMINE PREMIUM',
  ]

  // Obtener todos los productos de Supabase
  const { data: sbProducts } = await supabase.from('products').select('*')

  for (const missingName of missing) {
    console.log(`\n🔍 Buscando: "${missingName}"`)

    // Buscar por nombre exacto
    const exact = sbProducts?.find(p => p.name === missingName)
    if (exact) {
      console.log(`  ✅ Encontrado (exacto) - category_id: ${exact.category_id}, is_active: ${exact.is_active}`)
      continue
    }

    // Buscar por nombre parcial (sin texto extra)
    const partial = sbProducts?.find(p => 
      p.name.includes('BARBIE FIT') ||
      p.name.includes('SWEET BOO') ||
      p.name.includes('SUMMERBODY') ||
      p.name.includes('SUMMER BODY') ||
      p.name.includes('GLUTAMINE') ||
      p.name.includes('GLUTAMINA')
    )

    if (partial) {
      console.log(`  ✅ Encontrado (parcial) - "${partial.name}"`)
      console.log(`     category_id: ${partial.category_id}, is_active: ${partial.is_active}`)
    } else {
      console.log(`  ❌ NO ENCONTRADO en Supabase`)
    }
  }

  // Obtener productos de Wix para encontrar los wix_ids de los faltantes
  console.log('\n\n📦 Obteniendo productos de Wix...')
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

  console.log('\nProductos de Wix faltantes con sus wix_ids:')
  for (const missingName of missing) {
    const wixProd = wixProducts.find(p => p.name === missingName)
    if (wixProd) {
      console.log(`  - ${wixProd.name}`)
      console.log(`    wix_id: ${wixProd.id}`)
      console.log(`    collectionIds: ${wixProd.collectionIds?.join(', ')}`)
      console.log(`    visible: ${wixProd.visible}`)
    }
  }
}

main().catch(console.error)
