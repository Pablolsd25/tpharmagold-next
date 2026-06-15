import type { SupabaseClient } from '@supabase/supabase-js'
import { sortCategoriesByMenuOrder } from '@/lib/category-nav'
import { CATEGORY_WITH_PRODUCT_COUNTS, getCategoryProductCount } from '@/lib/supabase/product-selects'
import type { Category } from '@/types'

type CategoryRow = Category & {
  sort_order?: number
  product_categories?: Array<{ count: number }>
  products?: Array<{ count: number }>
}

/** Categorías activas ordenadas como el menú Wix (sort_order + fallback por slug). */
export async function fetchCategoriesMenuOrdered(
  supabase: SupabaseClient,
  options?: { withProductsOnly?: boolean },
): Promise<CategoryRow[]> {
  const { data } = await supabase
    .from('categories')
    .select(CATEGORY_WITH_PRODUCT_COUNTS)
    .order('name', { ascending: true })

  let rows = (data ?? []) as CategoryRow[]

  if (options?.withProductsOnly) {
    rows = rows.filter((c) => getCategoryProductCount(c) > 0)
  }

  return sortCategoriesByMenuOrder(rows)
}
