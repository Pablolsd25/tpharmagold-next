import { createClient } from '@supabase/supabase-js'
import { loadEnvLocal } from './load-env-local'
import { MUJERES_PRODUCT_SLUGS, HOMBRES_PRODUCT_SLUGS } from '../src/lib/tpharma-home'

loadEnvLocal()
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const { count } = await sb.from('products').select('*', { count: 'exact', head: true })
  console.log('Total productos:', count)

  for (const slug of [...MUJERES_PRODUCT_SLUGS, ...HOMBRES_PRODUCT_SLUGS]) {
    const { data } = await sb.from('products').select('name').eq('slug', slug).maybeSingle()
    console.log(slug, data ? '✅' : '❌', data?.name ?? '')
  }

  const { data: premium } = await sb.from('categories').select('id').eq('slug', 'premium').single()
  if (premium) {
    const { data: links } = await sb.from('product_categories').select('product:products(name, slug)').eq('category_id', premium.id)
    console.log('\nPremium (' + (links?.length ?? 0) + '):')
    for (const l of links ?? []) {
      const p = Array.isArray(l.product) ? l.product[0] : l.product
      console.log(' -', (p as { slug: string; name: string })?.slug)
    }
  }
}

main()
