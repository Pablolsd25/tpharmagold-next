import { createClient } from '@/lib/supabase/server'
import ProductGrid from '@/components/products/ProductGrid'
import FilterSelect from '@/components/products/FilterSelect'
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

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  let query = supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_active', true)

  if (params.categoria) {
    const cat = (categories ?? []).find((c: Category) => c.slug === params.categoria)
    if (cat) query = query.eq('category_id', cat.id)
  }

  if (params.orden === 'precio-asc') query = query.order('price', { ascending: true })
  else if (params.orden === 'precio-desc') query = query.order('price', { ascending: false })
  else query = query.order('created_at', { ascending: false })

  const { data: products } = await query
  const cats = (categories ?? []) as Category[]
  const prods = (products ?? []) as Product[]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-white font-black text-3xl mb-8">Tienda</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-8">
        <a
          href="/tienda"
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
            ${!params.categoria ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
        >
          Todos
        </a>
        {cats.map((cat) => (
          <a
            key={cat.id}
            href={`/tienda?categoria=${cat.slug}`}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${params.categoria === cat.slug ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
          >
            {cat.name}
          </a>
        ))}

        <div className="ml-auto">
            <FilterSelect currentOrden={params.orden} currentCategoria={params.categoria} />
          </div>
      </div>

      <p className="text-zinc-500 text-sm mb-6">{prods.length} productos encontrados</p>

      <ProductGrid products={prods} />
    </div>
  )
}
