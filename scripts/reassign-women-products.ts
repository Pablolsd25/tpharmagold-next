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
  console.log('🔧 Reasignando productos a Women\'s nutrition\n')

  const WOMENS_CAT_ID = 'ce1d4d02-1d13-451a-a163-2acd8e4dceef'

  // Orden de producción con keyword parcial para matchear nombres en Supabase
  const PRODUCTION_ORDER: Array<{ key: string; displayName: string }> = [
    { key: 'SÚPER PEACH', displayName: 'SUPER PEACH' },
    { key: 'SEXY PEACH', displayName: 'SEXY PEACH' },
    { key: 'PINK KIT', displayName: 'PINK KIT' },
    { key: 'BARBIE FIT', displayName: 'BARBIE FIT' },
    { key: 'EXTREME PINK KIT', displayName: 'EXTREME PINK KIT' },
    { key: 'SWEET BOO', displayName: 'SWEET BOO' },
    { key: 'PEACH SÚPER REDUCTOR', displayName: 'PEACH + SUMMER BODY' },
    { key: 'SÚPER PEACH+GLOW', displayName: 'PEACH + GLOW' },
    { key: 'GLOW PROTEIN PARA MUJERES', displayName: 'GLOW PROTEIN' },
    { key: 'ALL STARS', displayName: 'ALL STARS' },
    { key: 'SUMMERBODY', displayName: 'SUMMER BODY' },
    { key: 'EMPIRE CREATINA', displayName: 'EMPIRE CREATINA' },
    { key: 'EMPIRE L-GLUTAMINE', displayName: 'EMPIRE GLUTAMINA' },
    { key: 'LEMONADE BCAA', displayName: 'BCAAS' },
    { key: 'CANDY EXPLOSION', displayName: 'PREWORK' },
  ]

  // Keywords de productos que hay que mover a Women's nutrition
  const toReassign = ['BARBIE FIT', 'EMPIRE CREATINA']

  const { data: sbProducts } = await supabase.from('products').select('*')

  // ── PASO 1: Reasignar categoría ──────────────────────────────────
  console.log('PASO 1: Reasignando categoría por nombre parcial...\n')
  for (const keyword of toReassign) {
    const product = sbProducts?.find(p => p.name.toUpperCase().includes(keyword))
    if (!product) {
      console.log(`  ❌ No encontrado en Supabase: "${keyword}"`)
      continue
    }
    if (product.category_id === WOMENS_CAT_ID) {
      console.log(`  ⏭  "${product.name}" ya está en Women's nutrition`)
      continue
    }
    const { error } = await supabase
      .from('products')
      .update({ category_id: WOMENS_CAT_ID })
      .eq('id', product.id)
    if (error) {
      console.log(`  ❌ Error reasignando "${product.name}": ${error.message}`)
    } else {
      console.log(`  ✅ "${product.name}" → Women's nutrition`)
    }
  }

  // ── PASO 2: Aplicar sort_order ───────────────────────────────────
  console.log('\nPASO 2: Aplicando sort_order...\n')
  const { data: womenProds } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', WOMENS_CAT_ID)

  for (let i = 0; i < PRODUCTION_ORDER.length; i++) {
    const entry = PRODUCTION_ORDER[i]
    const product = womenProds?.find(p => p.name.toUpperCase().includes(entry.key.toUpperCase()))
    if (!product) {
      console.log(`  ⚠  Sin match para [${i + 1}] ${entry.displayName}`)
      continue
    }
    const { error } = await supabase
      .from('products')
      .update({ sort_order: i })
      .eq('id', product.id)
    if (error) {
      console.log(`  ❌ sort_order error "${product.name}": ${error.message}`)
    } else {
      console.log(`  ✅ [${i + 1}] ${entry.displayName} → "${product.name}"`)
    }
  }

  // ── RESULTADO FINAL ──────────────────────────────────────────────
  console.log('\n\n📊 Women\'s nutrition — resultado final:')
  const { data: final } = await supabase
    .from('products')
    .select('name, is_active, sort_order')
    .eq('category_id', WOMENS_CAT_ID)
    .order('sort_order', { ascending: true })

  console.log(`Total: ${final?.length || 0}`)
  final?.forEach(p => {
    const icon = p.is_active ? '✅' : '🔴'
    console.log(`  ${icon} [${p.sort_order ?? '-'}] ${p.name}`)
  })
}

main().catch(console.error)
