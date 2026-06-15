import { createAdminClient } from '@/lib/supabase/admin'
import { fetchCategoriesMenuOrdered } from '@/lib/categories-query'
import CategoryForm from '../CategoryForm'

export const metadata = { title: 'Nueva categoría | Admin' }

export default async function NuevaCategoriaPage() {
  const supabase = createAdminClient()
  const categories = await fetchCategoriesMenuOrdered(supabase)

  return <CategoryForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
}
