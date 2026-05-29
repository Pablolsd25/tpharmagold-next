import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProductGrid from '@/components/products/ProductGrid'
import type { Product, Category } from '@/types'
import type { Metadata } from 'next'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('categories').select('*').eq('slug', slug).single()
  return { title: data?.name ?? 'Categoría' }
}

export default async function CategoriaPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!category) notFound()

  const { data: products } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_active', true)
    .eq('category_id', (category as Category).id)
    .order('created_at', { ascending: false })

  const cat = category as Category
  const prods = (products ?? []) as Product[]

  return (
    <div>
      {/* Hero header */}
      <div className="relative bg-gradient-to-b from-zinc-900 to-black border-b border-zinc-800 overflow-hidden">
        {/* Radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(35,243,14,0.07),transparent_65%)] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-6 font-display uppercase tracking-wide">
            <Link href="/" className="hover:text-zinc-300 transition-colors">Inicio</Link>
            <span className="text-zinc-700">/</span>
            <Link href="/tienda" className="hover:text-zinc-300 transition-colors">Tienda</Link>
            <span className="text-zinc-700">/</span>
            <span className="text-accent">{cat.name}</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-white font-display font-bold text-4xl sm:text-5xl uppercase tracking-tight leading-none">
                {cat.name}
              </h1>
              <div className="mt-3 h-[3px] w-14 bg-accent rounded-full" />
              {cat.description && (
                <p className="text-zinc-400 mt-4 text-sm max-w-lg leading-relaxed">{cat.description}</p>
              )}
            </div>
            <span className="text-zinc-600 font-display text-sm uppercase tracking-wider shrink-0">
              {prods.length} {prods.length === 1 ? 'producto' : 'productos'}
            </span>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ProductGrid products={prods} />
      </div>
    </div>
  )
}
