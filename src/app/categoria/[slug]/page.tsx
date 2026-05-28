import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-white font-black text-3xl">{(category as Category).name}</h1>
        {(category as Category).description && (
          <p className="text-zinc-400 mt-2">{(category as Category).description}</p>
        )}
      </div>
      <ProductGrid products={(products ?? []) as Product[]} />
    </div>
  )
}
