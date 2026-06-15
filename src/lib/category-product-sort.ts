import type { Product } from '@/types'
import { CATEGORY_PRODUCT_SLUG_ORDERS } from '@/lib/category-product-order'
import { findProductBySlug, normalizeSlug } from '@/lib/slug'

/** Ordena productos según lista de slugs (scrape Wix). Productos extra van al final. */
export function sortProductsBySlugList<T extends Product>(
  products: T[],
  slugOrder: readonly string[],
): T[] {
  const byNorm = new Map<string, T>()
  for (const p of products) {
    byNorm.set(normalizeSlug(p.slug), p)
  }

  const used = new Set<string>()
  const ordered: T[] = []

  for (const slug of slugOrder) {
    const product = findProductBySlug(byNorm, slug)
    if (product && !used.has(product.id)) {
      used.add(product.id)
      ordered.push(product)
    }
  }

  for (const p of products) {
    if (!used.has(p.id)) ordered.push(p)
  }

  return ordered
}

export function getCategoryProductSlugOrder(categorySlug: string): readonly string[] | undefined {
  return CATEGORY_PRODUCT_SLUG_ORDERS[categorySlug]
}

export function sortProductsForCategory<T extends Product>(
  products: T[],
  categorySlug: string,
): T[] {
  const slugOrder = getCategoryProductSlugOrder(categorySlug)
  if (slugOrder?.length) return sortProductsBySlugList(products, slugOrder)
  return products
}
