import { createAdminClient } from '@/lib/supabase/admin'
import { getProductIdsInCategory } from '@/lib/product-categories'
import { notFound } from 'next/navigation'
import CategoryForm from '../CategoryForm'

export const metadata = { title: 'Editar categoría | Admin' }

export default async function EditarCategoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: category } = await supabase.from('categories').select('*').eq('id', id).maybeSingle()
  if (!category) notFound()

  const productIds = await getProductIdsInCategory(supabase, id)
  let products: { id: string; name: string; slug: string; price: number; images: string[]; category_id: string | null; is_active: boolean }[] = []

  if (productIds.length > 0) {
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, price, images, category_id, is_active')
      .in('id', productIds)
      .order('name')
    products = data ?? []
  }

  const { data: categories } = await supabase.from('categories').select('id, name').order('name')

  return (
    <CategoryForm
      category={category}
      initialProducts={products ?? []}
      categories={categories ?? []}
    />
  )
}
