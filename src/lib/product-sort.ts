import type { Product } from '@/types'

/** Ordena productos según mapa id → posición (menor = primero). */
export function sortProductsByOrderMap<
  T extends { id: string; name: string; sort_order?: number },
>(products: T[], orderMap: Map<string, number>, fallbackOffset = 10_000): T[] {
  return [...products].sort((a, b) => {
    const aRank = orderMap.has(a.id) ? orderMap.get(a.id)! : fallbackOffset + (a.sort_order ?? 0)
    const bRank = orderMap.has(b.id) ? orderMap.get(b.id)! : fallbackOffset + (b.sort_order ?? 0)
    if (aRank !== bRank) return aRank - bRank
    return a.name.localeCompare(b.name, 'es')
  })
}

export function sortProductsGlobal(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const diff = (a.sort_order ?? 0) - (b.sort_order ?? 0)
    if (diff !== 0) return diff
    return a.name.localeCompare(b.name, 'es')
  })
}
