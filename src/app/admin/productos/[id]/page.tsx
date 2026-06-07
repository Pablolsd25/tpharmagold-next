import { createAdminClient } from '@/lib/supabase/admin'
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

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).single(),
    supabase.from('categories').select('id, name, slug').order('name'),
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
