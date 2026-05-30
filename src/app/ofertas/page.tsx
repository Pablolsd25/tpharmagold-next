import { createClient } from '@/lib/supabase/server'
import ProductGrid from '@/components/products/ProductGrid'
import type { Product } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Nuestras Ofertas' }

// Slugs de los productos que pertenecen a "Nuestras Ofertas"
// Actualizar aquí cuando se agreguen o quiten productos de esta sección
const OFFER_SLUGS = [
  'pink-kit-mas-piernas-caderas-y-0-abdomen',
  'peach-super-reductor-gluteos',
  'extreme-pink-kit',
]

export default async function OfertasPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_active', true)
    .in('slug', OFFER_SLUGS)
    .order('name')

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
            Productos en oferta especial — precios exclusivos por tiempo limitado.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {products && products.length > 0 ? (
          <ProductGrid products={products as Product[]} />
        ) : (
          <p className="text-zinc-500 text-sm text-center py-16">
            No hay ofertas activas en este momento. ¡Vuelve pronto!
          </p>
        )}
      </div>
    </div>
  )
}
