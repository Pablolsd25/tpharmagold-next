/** Configuración de migración Wix → Supabase para T Pharma Gold */

export const WIX_SKIP_COLLECTIONS = new Set([
  'all products',
  'todos los productos',
  'best sellers',
  'lo más vendido',
  'suplementos',
  'nuevos',
  'nuevos lanzamientos',
  'categoría1',
  'categoria1',
])

export const WIX_OFFER_COLLECTIONS = new Set([
  'nuestras ofertas',
  'ofertas del mes',
  'oferta del mes',
  'ofertas',
])

/** Nombre Wix (lowercase) → slug canónico en Supabase */
export const WIX_SLUG_MAP: Record<string, string> = {
  "lo que ellas aman": 'mujeres',
  "women's nutrition": 'mujeres',
  'favoritos de ellas': 'mujeres',
  'pink kit': 'mujeres',
  'testimonios pink kit': 'mujeres',

  "lo que ellos prefieren": 'hombres',
  'men nutrition': 'hombres',
  varones: 'hombres',

  premium: 'premium',
  'productos premium': 'premium',
  't health línea natural': 't-health',
  't health linea natural': 't-health',
  'suplementos tpharma gold': 'suplementos',
  'fórmulas de rendimiento avanzado': 'formulas-rendimiento',
  'formulas de rendimiento avanzado': 'formulas-rendimiento',
  'suplementación de vanguardia': 'vanguardia',
  'suplementacion de vanguardia': 'vanguardia',
  'moduladores receptores selectivos': 'moduladores',
  'factores de crecimiento': 'factores-crecimiento',
}

/** Slugs que aparecen en navegación principal */
export const NAV_CATEGORY_SLUGS = ['mujeres', 'hombres', 'premium'] as const

/** Slugs usados para asignar category_id principal en productos */
export const PRIMARY_CATEGORY_SLUGS = new Set([
  'mujeres',
  'hombres',
  'premium',
  't-health',
  'suplementos',
  'formulas-rendimiento',
  'vanguardia',
  'moduladores',
  'factores-crecimiento',
])

export function resolveCategorySlug(collectionName: string): string | null {
  const lower = collectionName.toLowerCase().trim()
  if (WIX_SKIP_COLLECTIONS.has(lower) || WIX_OFFER_COLLECTIONS.has(lower)) {
    return null
  }
  if (WIX_SLUG_MAP[lower]) return WIX_SLUG_MAP[lower]
  return lower
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
