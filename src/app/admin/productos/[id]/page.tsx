import { createAdminClient } from '@/lib/supabase/admin'
import { fetchCategoriesMenuOrdered } from '@/lib/categories-query'
import { notFound } from 'next/navigation'
import { loadProductCategoryIds } from '@/lib/product-categories'
import ProductForm from '../ProductForm'

export const metadata = { title: 'Editar Producto | Admin' }

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: product }, categories] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).single(),
    fetchCategoriesMenuOrdered(supabase),
  ])

  if (!product) notFound()

  const initialCategoryIds = await loadProductCategoryIds(
    supabase,
    id,
    product.category_id,
  )

  return (
    <div>
      <ProductForm
        product={product}
        categories={categories ?? []}
        initialCategoryIds={initialCategoryIds}
      />
    </div>
  )
}
