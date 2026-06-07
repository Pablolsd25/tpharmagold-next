const OFFERS_CATEGORY_SLUGS = new Set(['ofertas', 'nuestras-ofertas'])

/** Categoría "Nuestras Ofertas" — distinta del flag is_offer pero ambos van a /ofertas */
export function isOffersCategory(
  category: { slug?: string | null; name?: string | null } | null | undefined,
): boolean {
  if (!category) return false
  const slug = category.slug?.toLowerCase().trim()
  if (slug && OFFERS_CATEGORY_SLUGS.has(slug)) return true
  const name = category.name?.toLowerCase().trim()
  return name === 'nuestras ofertas' || name === 'ofertas'
}
