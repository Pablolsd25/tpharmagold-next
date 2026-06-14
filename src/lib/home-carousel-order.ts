/**
 * Órdenes de carruseles del home — auto-generado por npm run scrape:home-carousels
 * Fuente: https://www.tpharmagold.com/ (2026-06-14)
 */

/** Widget Productos Premium — totalNumberOfProducts: 19 */
export const PREMIUM_CAROUSEL_SLUGS = [
  'booty-abs-legs-for-woman',
  'abs-chest-legs-max-volume-for-men',
  'booty-abs-legs-for-woman-max',
  'tpower-precursor-de-testosterona',
  'boobs-hips',
  'mass-stack-for-women',
  'carni-cafit',
  'mass-stack-for-men',
  'chest-max-volume-super-pack',
  'pack-súper-reductor-glúteos-y-piernas-grandes',
  'pink-protein-para-mujeres-abs-booty-legs',
  'abs-chest-legs-max-cut-for-men',
  'pink-booty-boobs-kit',
  'extreme-pink-kit',
  'full-pack-hombre-súper-quemador',
  'pack-mujer-quemador',
  'abs-booty-legs-pink-protein',
  'abs-booty-legs-max-pink-protein',
  'chest-max-volume-protein',
] as const

/** Widget Lo que ellas aman — totalNumberOfProducts: 8 */
export const MUJERES_CAROUSEL_SLUGS = [
  'booty-abs-legs-for-woman',
  'booty-abs-legs-for-woman-max',
  'mass-stack-for-women',
  'pink-protein-para-mujeres-abs-booty-legs',
  'pack-súper-reductor-glúteos-y-piernas-grandes',
  'pink-booty-boobs-kit',
  'extreme-pink-kit',
  'pack-mujer-quemador',
] as const

/** Widget Lo que ellos prefieren — totalNumberOfProducts: 6 */
export const HOMBRES_CAROUSEL_SLUGS = [
  'abs-chest-legs-max-volume-for-men',
  'tpower-precursor-de-testosterona',
  'chest-max-volume-super-pack',
  'chest-max-volume-protein',
  'full-pack-hombre-súper-quemador',
  'mass-stack-for-men',
] as const

export const HOME_CAROUSEL_SLUGS = {
  premium: [...PREMIUM_CAROUSEL_SLUGS],
  mujeres: [...MUJERES_CAROUSEL_SLUGS],
  hombres: [...HOMBRES_CAROUSEL_SLUGS],
} as const
