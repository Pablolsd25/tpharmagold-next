import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import CategoryGrid, { type CategoryCard } from './CategoryGrid'
import { CATEGORY_ADMIN_LIST_SELECT, getCategoryProductCount } from '@/lib/supabase/product-selects'
import { fetchCategoriesMenuOrdered } from '@/lib/categories-query'

export const metadata = { title: 'Categorías | Admin' }

export default async function AdminCategoriasPage() {
  await createClient()
  const supabase = createAdminClient()
  const ordered = await fetchCategoriesMenuOrdered(supabase)

  const cats: CategoryCard[] = ordered.map((c) => ({
    id:        c.id,
    name:      c.name,
    slug:      c.slug,
    image_url: c.image_url,
    count:     getCategoryProductCount(c),
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-white font-display font-bold text-3xl uppercase tracking-wide">
            Categorías <span className="text-zinc-600">{cats.length}</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-1 max-w-lg">
            Agrupa productos relacionados en categorías y agrégalas a tu tienda.
          </p>
        </div>
        <Link href="/admin/categorias/nuevo" className="btn-accent px-5 py-2.5 rounded text-sm whitespace-nowrap flex-shrink-0">
          + Nueva categoría
        </Link>
      </div>

      <CategoryGrid initial={cats} />
    </div>
  )
}
