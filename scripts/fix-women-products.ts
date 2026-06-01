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

const PRODUCTS_ORDER = [
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

// Map local product names to expected production names
const NAME_MAPPING: Record<string, string> = {
  'SÚPER PEACH': 'SUPER PEACH',
  'SEXY PEACH (EXTRA GLÚTEOS Y PIERNAS)': 'SEXY PEACH',
  'PINK KIT (MAS PIERNAS+CADERAS Y 0 ABDOMEN)': 'PINK KIT',
  'SÚPER PEACH+GLOW PROTEIN PACK': 'PEACH + GLOW',
  'GLOW PROTEIN PARA MUJERES': 'GLOW PROTEIN',
  'LEMONADE BCAA 2:1:1': 'BCAAS',
  'CANDY EXPLOSION PRE WORKOUT🍬🍭': 'PREWORK',
}

async function main() {

  // Obtener la categoría women-s-nutrition
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', 'women-s-nutrition')
    .single()

  if (!category) {
    console.error('Categoría women-s-nutrition no encontrada')
    return
  }

  console.log(`Categoría: ${category.name} (ID: ${category.id})`)

  // Obtener todos los productos de la categoría
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', category.id)

  console.log(`\nProductos encontrados: ${products?.length || 0}`)

  if (products) {
    console.log('\nProductos actuales:')
    products.forEach(p => {
      console.log(`  - ${p.name} (is_active: ${p.is_active}, sort_order: ${p.sort_order})`)
    })
  }

  // Verificar qué productos faltan
  const existingNames = new Set(products?.map(p => NAME_MAPPING[p.name] || p.name.toUpperCase()) || [])
  const missing = PRODUCTS_ORDER.filter(name => !existingNames.has(name))

  console.log('\nProductos faltantes:')
  missing.forEach(name => console.log(`  - ${name}`))

  // Actualizar sort_order para los productos que existen
  if (products) {
    console.log('\nActualizando sort_order...')
    for (const product of products) {
      const mappedName = NAME_MAPPING[product.name] || product.name.toUpperCase()
      const orderIndex = PRODUCTS_ORDER.indexOf(mappedName)
      if (orderIndex !== -1) {
        const { error } = await supabase
          .from('products')
          .update({ sort_order: orderIndex })
          .eq('id', product.id)
        if (error) {
          console.log(`  ✗ ${product.name} error: ${error.message}`)
        } else {
          console.log(`  ✓ ${product.name} -> sort_order: ${orderIndex}`)
        }
      } else {
        console.log(`  ⚠ ${product.name} no está en la lista de orden esperado`)
      }
    }
  }

  // Activar productos que estén desactivados
  if (products) {
    const inactive = products.filter(p => {
      const mappedName = NAME_MAPPING[p.name] || p.name.toUpperCase()
      return !p.is_active && PRODUCTS_ORDER.includes(mappedName)
    })
    if (inactive.length > 0) {
      console.log('\nActivando productos desactivados...')
      for (const product of inactive) {
        await supabase
          .from('products')
          .update({ is_active: true })
          .eq('id', product.id)
        console.log(`  ✓ Activado: ${product.name}`)
      }
    }
  }

  console.log('\n✅ Script completado')
}

main().catch(console.error)
