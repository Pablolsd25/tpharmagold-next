import { createClient } from '@/lib/supabase/server'
import ProductGrid from '@/components/products/ProductGrid'
import type { Product } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Nuestras Ofertas' }

export default async function OfertasPage() {
  const supabase = await createClient()

  // Try to get products in the 'ofertas' category first
  const { data: ofertasCat } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'ofertas')
    .single()

  let products = null
  let isOfertasCategory = false

  if (ofertasCat) {
    const { data } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_active', true)
      .eq('category_id', ofertasCat.id)
      .order('created_at', { ascending: false })
    products = data
    isOfertasCategory = (data?.length ?? 0) > 0
  }

  // Fallback: show newest 12 products
  if (!products || products.length === 0) {
    const { data } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(12)
    products = data
  }

  return (
    <div>
      {/* Page header */}
      <div className="relative bg-gradient-to-b from-zinc-900 to-black border-b border-zinc-800 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(35,243,14,0.06),transparent_65%)] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <h1 className="text-white font-display font-bold text-4xl sm:text-5xl uppercase tracking-tight leading-none">
            Nuestras Ofertas
          </h1>
          <div className="mt-3 h-[3px] w-14 bg-accent rounded-full" />
          <p className="text-zinc-400 mt-4 text-sm max-w-lg">
            {isOfertasCategory
              ? 'Productos en oferta especial — precios exclusivos por tiempo limitado.'
              : 'Descubre todos nuestros suplementos de alta calidad. ¡Próximamente más promociones!'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ProductGrid products={(products ?? []) as Product[]} />
      </div>
    </div>
  )
}
