/**
 * Categorías y menú principal — espejo de https://www.tpharmagold.com/ (dropdown MENÚ).
 * Regenerar orden del menú: npm run scrape:menu-categories
 */

/** Nombre visible por slug (Wix / navegación) */
export const CANONICAL_CATEGORY_NAMES: Record<string, string> = {
  premium: 'Premium',
  't-health': 'T Health Línea Natural',
  suplementos: 'Suplementos Tpharma Gold',
  'formulas-rendimiento': 'Fórmulas de Rendimiento Avanzado',
  vanguardia: 'Suplementación de Vanguardia',
  moduladores: 'Moduladores Receptores Selectivos',
  'factores-crecimiento': 'Factores de Crecimiento',
  mujeres: 'Lo que ellas aman',
  hombres: 'Lo que ellos prefieren',
}

/**
 * Orden del menú Wix (categorías de tienda).
 * Scrape 2026-06-10: INICIO → PREMIUM → T HEALTH → … → FACTORES DE CRECIMIENTO
 */
export const CATEGORY_MENU_SLUG_ORDER = [
  'premium',
  't-health',
  'suplementos',
  'formulas-rendimiento',
  'vanguardia',
  'moduladores',
  'factores-crecimiento',
] as const

/** Categorías extra en Supabase (no están en el menú Wix) */
export const CATEGORY_TAIL_SLUG_ORDER = ['mujeres', 'hombres'] as const

/** Orden para listados de categorías (tienda, admin, filtros) */
export const CATEGORY_DISPLAY_ORDER = [
  ...CATEGORY_MENU_SLUG_ORDER,
  ...CATEGORY_TAIL_SLUG_ORDER,
] as const

const CATEGORY_RANK = new Map<string, number>(
  CATEGORY_DISPLAY_ORDER.map((slug, index) => [slug, index]),
)

/** Orden y etiquetas del desplegable "Menú" en la navbar */
export const TPHARMA_MENU_NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/categoria/premium', label: CANONICAL_CATEGORY_NAMES.premium },
  { href: '/categoria/t-health', label: CANONICAL_CATEGORY_NAMES['t-health'] },
  { href: '/categoria/suplementos', label: CANONICAL_CATEGORY_NAMES.suplementos },
  {
    href: '/categoria/formulas-rendimiento',
    label: CANONICAL_CATEGORY_NAMES['formulas-rendimiento'],
  },
  { href: '/categoria/vanguardia', label: CANONICAL_CATEGORY_NAMES.vanguardia },
  {
    href: '/categoria/moduladores',
    label: CANONICAL_CATEGORY_NAMES.moduladores,
  },
  {
    href: '/categoria/factores-crecimiento',
    label: CANONICAL_CATEGORY_NAMES['factores-crecimiento'],
  },
  { href: '/testimonios', label: 'Testimonios Pink Kit' },
  { href: '/resenas', label: 'Reseñas' },
  { href: '/ofertas', label: 'Ofertas del Mes' },
] as const

export function categoryDisplayName(slug: string, dbName?: string | null): string {
  return CANONICAL_CATEGORY_NAMES[slug] ?? dbName?.trim() ?? slug
}

export function sortCategoriesByMenuOrder<T extends { slug: string; name?: string | null }>(
  categories: T[],
): T[] {
  return [...categories].sort((a, b) => {
    const aRank = CATEGORY_RANK.get(a.slug) ?? 999
    const bRank = CATEGORY_RANK.get(b.slug) ?? 999
    if (aRank !== bRank) return aRank - bRank
    return (a.name ?? a.slug).localeCompare(b.name ?? b.slug, 'es')
  })
}

export function categoryMenuSortIndex(slug: string): number {
  return CATEGORY_RANK.get(slug) ?? 999
}
