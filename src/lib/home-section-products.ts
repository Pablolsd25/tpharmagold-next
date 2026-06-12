import type { SupabaseClient } from '@supabase/supabase-js'
import { getProductIdsInCategory } from '@/lib/product-categories'
import { HOMBRES_PRODUCT_SLUGS, HOME_SECTIONS, type HomeSectionConfig } from '@/lib/tpharma-home'
import { PRODUCT_WITH_CATEGORY } from '@/lib/supabase/product-selects'
import type { Product } from '@/types'

async function fetchBySlugs(
  supabase: SupabaseClient,
  slugs: string[],
): Promise<Product[]> {
  if (slugs.length === 0) return []

  const { data } = await supabase
    .from('products')
    .select(PRODUCT_WITH_CATEGORY)
    .eq('is_active', true)
    .in('slug', slugs)

  if (!data?.length) return []

  const bySlug = new Map(data.map((p) => [p.slug, p as Product]))
  return slugs.map((s) => bySlug.get(s)).filter((p): p is Product => Boolean(p))
}

async function fetchByCategory(
  supabase: SupabaseClient,
  categorySlug: string,
): Promise<Product[]> {
  const { data: cat } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .maybeSingle()

  if (!cat) return []

  const ids = await getProductIdsInCategory(supabase, cat.id)
  if (ids.length === 0) return []

  const { data } = await supabase
    .from('products')
    .select(PRODUCT_WITH_CATEGORY)
    .eq('is_active', true)
    .in('id', ids)
    .order('sort_order', { ascending: true })

  return (data ?? []) as Product[]
}

function applyLimit(products: Product[], limit?: number): Product[] {
  if (!limit || products.length <= limit) return products
  return products.slice(0, limit)
}

export async function getHomeSectionProducts(
  supabase: SupabaseClient,
  section: HomeSectionConfig,
): Promise<Product[]> {
  let products: Product[] = []

  if (section.productSlugs?.length) {
    products = await fetchBySlugs(supabase, section.productSlugs)
  } else if (section.categorySlug) {
    products = await fetchByCategory(supabase, section.categorySlug)
    if (products.length === 0 && section.categorySlug === 'hombres') {
      products = await fetchBySlugs(supabase, [...HOMBRES_PRODUCT_SLUGS])
    }
  }

  return applyLimit(products, section.homeLimit)
}

export async function getAllHomeSectionProducts(
  supabase: SupabaseClient,
): Promise<Record<string, Product[]>> {
  const entries = await Promise.all(
    HOME_SECTIONS.map(async (section) => [
      section.id,
      await getHomeSectionProducts(supabase, section),
    ] as const),
  )
  return Object.fromEntries(entries)
}
