import { createAdminClient } from '@/lib/supabase/admin'
import { fetchCategoriesMenuOrdered } from '@/lib/categories-query'
import ProductForm from '../ProductForm'

export const metadata = { title: 'Nuevo Producto | Admin' }

export default async function NuevoProductoPage() {
  const supabase = createAdminClient()
  const categories = await fetchCategoriesMenuOrdered(supabase)

  return (
    <div>
      <ProductForm categories={categories} />
    </div>
  )
}
