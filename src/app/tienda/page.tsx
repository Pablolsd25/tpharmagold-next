import { createClient } from '@/lib/supabase/server'
import ProductGrid from '@/components/products/ProductGrid'
import FilterSelect from '@/components/products/FilterSelect'
import PageHero from '@/components/layout/PageHero'
import type { Product, Category } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tienda' }

interface SearchParams { categoria?: string; orden?: string }

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch categories with product count — only show those with products
  const { data: rawCats } = await supabase
    .from('categories')
    .select('*, products:products(count)')
    .order('name')

  const cats = ((rawCats ?? []) as any[])
    .filter((c) => (c.products?.[0]?.count ?? 0) > 0) as Category[]

  let query = supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_active', true)

  if (params.categoria) {
    const cat = cats.find((c) => c.slug === params.categoria)
    if (cat) query = query.eq('category_id', cat.id)
  }

  if (params.orden === 'precio-asc') query = query.order('price', { ascending: true })
  else if (params.orden === 'precio-desc') query = query.order('price', { ascending: false })
  else query = query.order('created_at', { ascending: false })

  const { data: products } = await query
  const prods = (products ?? []) as Product[]

  return (
    <div>
      {/* Page header */}
      <PageHero
        title="Tienda"
        subtitle="Todos nuestros suplementos y nutrición deportiva"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <a
            href="/tienda"
            className={`px-4 py-1.5 rounded-sm text-xs font-display uppercase tracking-widest transition-all duration-200
              ${!params.categoria
                ? 'bg-accent text-black font-bold'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-600 hover:text-white'}`}
          >
            Todos
          </a>
          {cats.map((cat) => (
            <a
              key={cat.id}
              href={`/tienda?categoria=${cat.slug}`}
              className={`px-4 py-1.5 rounded-sm text-xs font-display uppercase tracking-widest transition-all duration-200
                ${params.categoria === cat.slug
                  ? 'bg-accent text-black font-bold'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-600 hover:text-white'}`}
            >
              {cat.name}
            </a>
          ))}

          <div className="ml-auto">
            <FilterSelect currentOrden={params.orden} currentCategoria={params.categoria} />
          </div>
        </div>

        <p className="text-zinc-600 text-xs font-display uppercase tracking-wider mb-6">
          {prods.length} {prods.length === 1 ? 'producto' : 'productos'} encontrados
        </p>

        <ProductGrid products={prods} />
      </div>
    </div>
  )
}
