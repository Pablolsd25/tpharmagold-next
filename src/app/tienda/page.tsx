import { createClient } from '@/lib/supabase/server'
import { fetchActiveProductsByCategory, getProductIdsInCategory } from '@/lib/product-categories'
import { PRODUCT_WITH_CATEGORY, CATEGORY_WITH_PRODUCT_COUNTS, getCategoryProductCount } from '@/lib/supabase/product-selects'
import ProductGrid from '@/components/products/ProductGrid'
import FilterSelect from '@/components/products/FilterSelect'
import PageHero from '@/components/layout/PageHero'
import { categoryDisplayName } from '@/lib/category-nav'
import { sortProductsGlobal } from '@/lib/product-sort'
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
    .select(CATEGORY_WITH_PRODUCT_COUNTS)
    .order('name')

  const cats = (rawCats ?? [])
    .filter((c) => getCategoryProductCount(c) > 0) as Category[]

  let prods: Product[] = []
  const activeCat = params.categoria ? cats.find((c) => c.slug === params.categoria) : undefined

  if (activeCat && !params.orden) {
    prods = (await fetchActiveProductsByCategory(supabase, activeCat.id)) as Product[]
  } else {
    let query = supabase
      .from('products')
      .select(PRODUCT_WITH_CATEGORY)
      .eq('is_active', true)

    if (activeCat) {
      const ids = await getProductIdsInCategory(supabase, activeCat.id)
      if (ids.length > 0) query = query.in('id', ids)
      else query = query.eq('category_id', activeCat.id)
    }

    if (params.orden === 'precio-asc') query = query.order('price', { ascending: true })
    else if (params.orden === 'precio-desc') query = query.order('price', { ascending: false })
    else query = query.order('sort_order', { ascending: true }).order('name', { ascending: true })

    const { data: products } = await query
    prods = (products ?? []) as Product[]

    if (!params.orden) {
      prods = sortProductsGlobal(prods)
    }
  }

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
              {categoryDisplayName(cat.slug, cat.name)}
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
