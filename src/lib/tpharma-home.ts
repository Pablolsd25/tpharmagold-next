/** Secciones de inicio — orden y textos de https://www.tpharmagold.com/ */

export type HomeSectionConfig = {
  id: string
  title: string
  subtitle: string
  categorySlug?: string
  productSlugs?: string[]
  homeLimit?: number
  ctaHref?: string
  ctaLabel?: string
  /** CTA arriba del carrusel (Premium) o abajo (otras secciones) */
  ctaPosition?: 'top' | 'bottom'
  showCta?: boolean
  accent: 'green' | 'pink' | 'gold'
}

export const MUJERES_PRODUCT_SLUGS = [
  'booty-abs-legs-for-woman',
  'booty-abs-legs-for-woman-max',
  'mass-stack-for-women',
  'pink-protein-para-mujeres-abs-booty-legs',
  'pack-super-reductor-gluteos-y-piernas-grandes',
  'combo-beach-peach',
  'extreme-pink-kit',
  'pack-mujer-quemador',
] as const

export const HOMBRES_PRODUCT_SLUGS = [
  'abs-chest-legs-max-volume-for-men',
  'tpower-precursor-de-testosterona',
  'chest-max-volume-super-pack',
  'chest-max-volume-protein',
  'full-pack-hombre-super-quemador',
  'mass-stack-for-men',
] as const

export const HOME_SECTIONS: HomeSectionConfig[] = [
  {
    id: 'premium',
    title: 'Productos Premium',
    subtitle: 'Explora nuestros productos más vendidos y legendarios',
    categorySlug: 'premium',
    homeLimit: 8,
    ctaHref: '/categoria/premium',
    ctaLabel: 'Comprar ahora',
    ctaPosition: 'top',
    showCta: true,
    accent: 'gold',
  },
  {
    id: 'mujeres',
    title: 'Lo que ellas aman',
    subtitle:
      'Nuestros productos han sido fieles compañeros de nuestras consumidoras durante 12 años, apoyándolas en cada paso de su proceso fitness. Con calidad y dedicación, hemos creado una línea que no solo se adapta a sus necesidades, sino que también celebra sus logros y transformaciones.',
    productSlugs: [...MUJERES_PRODUCT_SLUGS],
    homeLimit: 8,
    ctaHref: '/categoria/mujeres',
    ctaLabel: 'Shop Now',
    ctaPosition: 'bottom',
    showCta: true,
    accent: 'pink',
  },
  {
    id: 'hombres',
    title: 'Lo que ellos prefieren',
    subtitle:
      'Nuestros productos han sido aliados leales de nuestros consumidores durante 12 años, generando cambios reales y duraderos. Gracias a nuestra calidad y dedicación, hemos desarrollado una línea que no solo se ajusta a sus necesidades, sino que también honra sus logros y transformaciones.',
    productSlugs: [...HOMBRES_PRODUCT_SLUGS],
    homeLimit: 8,
    ctaHref: '/categoria/hombres',
    ctaLabel: 'Shop Now',
    ctaPosition: 'bottom',
    showCta: true,
    accent: 'green',
  },
]

/** Items del menú desplegable "Menú" */
export const TPHARMA_MENU_NAV = [
  { href: '/categoria/premium', label: 'Premium' },
  { href: '/tienda', label: 'Comprar' },
  { href: '/categoria/t-health', label: 'T Health Línea Natural' },
  { href: '/categoria/suplementos', label: 'Suplementos Tpharma Gold' },
  { href: '/categoria/formulas-rendimiento', label: 'Orales' },
  { href: '/categoria/vanguardia', label: 'Viales' },
  { href: '/categoria/moduladores', label: 'SARMs' },
  { href: '/categoria/factores-crecimiento', label: 'Hormonas' },
  { href: '/ofertas', label: 'Ofertas del Mes' },
] as const

/** Barra superior visible en Wix */
export const TPHARMA_HEADER_NAV = [
  { href: '/envios', label: 'Envíos Seguros' },
  { href: '/quienes-somos', label: 'Sobre Nosotros' },
  { href: '/terminos', label: 'Términos y Condiciones' },
] as const

export const TPHARMA_MORE_NAV = [
  { href: '/blog', label: 'Blog' },
  { href: '/privacidad', label: 'Política de Privacidad' },
  { href: '/garantia', label: 'Política de Devolución' },
  { href: '/contacto', label: 'Contacto' },
  { href: '/tienda', label: 'Tienda' },
] as const

export const TPHARMA_SOCIAL = {
  whatsapp: 'https://wa.link/tpharmagold',
  instagram: 'https://www.instagram.com/tpharmagold?igsh=MXd2dWgwZHZyOHJ2aw==',
} as const

export const WIX_ABOUT_TEXT =
  'En Tpharmagold, somos una plataforma de distribución especializada en México, por más de 10 años enfocada en proveer compuestos de bio-investigación, factores de crecimiento y soluciones de suplementación avanzada para atletas de alto rendimiento y profesionales del sector experimental. Entendemos las exigencias del deporte de élite y el desarrollo biológico. Por ello, nos comprometemos con la excelencia, ofreciendo exclusivamente productos que cumplen con los más estrictos estándares de pureza, calidad y verificación de laboratorio. Respaldamos el trabajo de atletas de alto nivel y centros de evaluación física con herramientas de vanguardia tecnológica, garantizando un servicio transparente, envíos nacionales seguros y soluciones analíticas de la más alta fidelidad en el mercado.'
