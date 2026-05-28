import { createClient } from '@/lib/supabase/server'
import ProductGrid from '@/components/products/ProductGrid'
import type { Product } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Nuestras Ofertas' }

export default async function OfertasPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_active', true)
    .not('compare_at_price', 'is', null)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-white font-black text-3xl">Nuestras Ofertas</h1>
        <p className="text-zinc-400 mt-2">Los mejores precios en suplementos y nutrición.</p>
      </div>
      <ProductGrid products={(products ?? []) as Product[]} />
    </div>
  )
}
