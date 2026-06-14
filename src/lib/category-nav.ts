/**
 * Categorías y menú principal — espejo de https://www.tpharmagold.com/
 * Los slugs coinciden con la migración Wix → Supabase (wix-migration-config.ts).
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

/** Orden y etiquetas del desplegable "Menú" en la navbar */
export const TPHARMA_MENU_NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/categoria/premium', label: 'Premium' },
  { href: '/categoria/t-health', label: 'T Health Línea Natural' },
  { href: '/categoria/suplementos', label: 'Suplementos Tpharma Gold' },
  {
    href: '/categoria/formulas-rendimiento',
    label: 'Fórmulas de Rendimiento Avanzado',
  },
  { href: '/categoria/vanguardia', label: 'Suplementación de Vanguardia' },
  {
    href: '/categoria/moduladores',
    label: 'Moduladores Receptores Selectivos',
  },
  { href: '/categoria/factores-crecimiento', label: 'Factores de Crecimiento' },
  { href: '/testimonios', label: 'Testimonios Pink Kit' },
  { href: '/ofertas', label: 'Ofertas del Mes' },
] as const

export function categoryDisplayName(slug: string, dbName?: string | null): string {
  return CANONICAL_CATEGORY_NAMES[slug] ?? dbName?.trim() ?? slug
}
