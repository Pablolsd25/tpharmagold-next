import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import CategoryManager from './CategoryManager'

export const metadata = { title: 'Categorías | Admin' }

export default async function AdminCategoriasPage() {
  await createClient() // auth check via layout
  const supabase = createAdminClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-white font-display font-bold text-3xl uppercase tracking-wide">Categorías</h1>
        <p className="text-zinc-500 text-sm mt-1">{(categories ?? []).length} categorías</p>
      </div>
      <CategoryManager categories={categories ?? []} />
    </div>
  )
}
