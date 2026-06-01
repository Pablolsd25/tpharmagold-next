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

async function main() {
  // Desactivar GLOW PROTEIN viejo (wix_id único, solo en All Products, no debe mostrarse)
  const { error } = await sb
    .from('products')
    .update({ is_active: false })
    .eq('wix_id', '657af36b-f6fa-d2e1-3a26-da5ae6c3b829')

  if (error) console.log('❌', error.message)
  else console.log('✅ GLOW PROTEIN (duplicado viejo) desactivado')

  // Verificar estado final de Women's nutrition (solo activos)
  const { data } = await sb
    .from('products')
    .select('name, sort_order')
    .eq('category_id', 'ce1d4d02-1d13-451a-a163-2acd8e4dceef')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  console.log(`\n📊 Women's nutrition activos: ${data?.length || 0}`)
  data?.forEach(p => console.log(`  [${p.sort_order}] ${p.name}`))
}

main().catch(console.error)
