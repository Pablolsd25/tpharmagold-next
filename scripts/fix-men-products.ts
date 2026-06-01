import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const [key, ...vals] = line.split('=')
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
  }
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Orden exacto de producción (página de la derecha)
const PRODUCTION_ORDER: Array<{ key: string; displayName: string }> = [
  { key: 'ARMAGGEDON', displayName: 'ARMAGEDDON (PRECURSOR DE TESTOSTERONA)' },
  { key: 'OLYMPUS MAX', displayName: 'OLYMPUS MAX PARA VARONES' },
  { key: 'ISO REVOLUTION', displayName: 'ISO REVOLUTION PROTEIN' },
  { key: 'BULLFIRE', displayName: 'BULLFINE - DESTRUCTOR DE GRASA PARA VARONES' },
  { key: 'EMPIRE CREATINA', displayName: 'EMPIRE CREATINA MONOHIDRATADA PREMIUM' },
  { key: 'EMPIRE L - GLUTAMINE', displayName: 'EMPIRE L - GLUTAMINA PREMIUM' },
  { key: 'LEMONADE BCAA', displayName: 'BCAAS 2:1:1' },
]

const MEN_CAT_ID = 'fa7a76af-6241-49c2-a849-65eea9a710f1'

async function main() {
  // Listar productos actuales
  const { data: current } = await sb
    .from('products')
    .select('name, is_active, sort_order, category_id')
    .eq('category_id', MEN_CAT_ID)

  console.log(`📦 Productos en Men's Nutrition: ${current?.length || 0}`)
  current?.forEach(p => console.log(`  ${p.is_active ? '✅' : '🔴'} [${p.sort_order ?? '-'}] ${p.name}`))

  // Obtener todos con is_active para sort_order
  const { data: prods } = await sb
    .from('products')
    .select('*')
    .eq('category_id', MEN_CAT_ID)

  console.log('\n🔧 Aplicando sort_order según producción...\n')
  for (let i = 0; i < PRODUCTION_ORDER.length; i++) {
    const entry = PRODUCTION_ORDER[i]
    const product = prods?.find(p => p.name.toUpperCase().includes(entry.key.toUpperCase()))
    if (!product) {
      console.log(`  ⚠  Sin match para [${i + 1}] ${entry.displayName}`)
      continue
    }
    const { error } = await sb
      .from('products')
      .update({ sort_order: i })
      .eq('id', product.id)
    if (error) {
      console.log(`  ❌ Error "${product.name}": ${error.message}`)
    } else {
      console.log(`  ✅ [${i + 1}] ${entry.displayName} → "${product.name}"`)
    }
  }

  // Resultado final
  console.log('\n📊 Men\'s Nutrition — resultado final (activos):')
  const { data: final } = await sb
    .from('products')
    .select('name, sort_order, is_active')
    .eq('category_id', MEN_CAT_ID)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  console.log(`Total activos: ${final?.length || 0}`)
  final?.forEach(p => console.log(`  [${p.sort_order}] ${p.name}`))
}

main().catch(console.error)
