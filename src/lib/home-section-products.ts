import type { SupabaseClient } from '@supabase/supabase-js'
import { getProductIdsInCategory } from '@/lib/product-categories'
import { HOMBRES_PRODUCT_SLUGS, HOME_SECTIONS, type HomeSectionConfig } from '@/lib/tpharma-home'
import { normalizeSlug, SLUG_ALIASES } from '@/lib/slug'
import { PRODUCT_WITH_CATEGORY } from '@/lib/supabase/product-selects'
import { sortProductsByOrderMap, sortProductsGlobal } from '@/lib/product-sort'
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

  if (!data?.length) return []

  const byNormalizedSlug = new Map<string, Product>()
  for (const row of data) {
    const product = row as Product
    byNormalizedSlug.set(normalizeSlug(product.slug), product)
  }

  function resolveSlug(slug: string): Product | undefined {
    const direct = byNormalizedSlug.get(normalizeSlug(slug))
    if (direct) return direct
    for (const alias of SLUG_ALIASES[slug] ?? SLUG_ALIASES[normalizeSlug(slug)] ?? []) {
      const match = byNormalizedSlug.get(normalizeSlug(alias))
      if (match) return match
    }
    return undefined
  }

  const usedIds = new Set<string>()
  const result: Product[] = []

  for (const slug of slugs) {
    const product = resolveSlug(slug)
    if (!product || usedIds.has(product.id)) continue
    usedIds.add(product.id)
    result.push(product)
  }

  return result
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

  const { data: links, error: linksError } = await supabase
    .from('product_categories')
    .select('product_id, sort_order')
    .eq('category_id', cat.id)
    .order('sort_order', { ascending: true })

  const orderMap = new Map<string, number>()
  if (!linksError) {
    for (const row of links ?? []) {
      orderMap.set(row.product_id, row.sort_order ?? 0)
    }
  }

  const { data } = await supabase
    .from('products')
    .select(PRODUCT_WITH_CATEGORY)
    .eq('is_active', true)
    .in('id', ids)

  const products = (data ?? []) as Product[]
  if (orderMap.size === 0) {
    return sortProductsGlobal(products)
  }
  return sortProductsByOrderMap(products, orderMap)
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
    products = await fetchBySlugs(supabase, [...section.productSlugs])
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
