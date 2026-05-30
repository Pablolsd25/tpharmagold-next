import { createClient } from '@/lib/supabase/server'
import ProductGrid from '@/components/products/ProductGrid'
import PageHero from '@/components/layout/PageHero'
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
      <PageHero
        title="Nuestras Ofertas"
        subtitle="Productos en oferta especial — precios exclusivos por tiempo limitado."
        image="/hero-secondary.jpg"
      />

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
