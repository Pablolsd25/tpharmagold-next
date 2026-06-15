/** Secciones de inicio — orden y textos de https://www.tpharmagold.com/ */

import {
  HOMBRES_CAROUSEL_SLUGS,
  MUJERES_CAROUSEL_SLUGS,
  PREMIUM_CAROUSEL_SLUGS,
} from '@/lib/home-carousel-order'
import { LEGAL } from '@/lib/site-legal'

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

export const MUJERES_PRODUCT_SLUGS = MUJERES_CAROUSEL_SLUGS

export const HOMBRES_PRODUCT_SLUGS = HOMBRES_CAROUSEL_SLUGS

export const HOME_SECTIONS: HomeSectionConfig[] = [
  {
    id: 'premium',
    title: 'Productos Premium',
    subtitle: 'Explora nuestros productos más vendidos y legendarios',
    productSlugs: [...PREMIUM_CAROUSEL_SLUGS],
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
    productSlugs: [...MUJERES_CAROUSEL_SLUGS],
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
    productSlugs: [...HOMBRES_CAROUSEL_SLUGS],
    ctaHref: '/categoria/hombres',
    ctaLabel: 'Shop Now',
    ctaPosition: 'bottom',
    showCta: true,
    accent: 'green',
  },
]

/** Items del menú desplegable "Menú" — ver category-nav.ts */
export { TPHARMA_MENU_NAV } from '@/lib/category-nav'

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
  whatsapp: LEGAL.whatsappUrl,
  instagram: 'https://www.instagram.com/tpharmagold?igsh=MXd2dWgwZHZyOHJ2aw==',
} as const

export const WIX_ABOUT_TEXT =
  'En Tpharmagold, somos una plataforma de distribución especializada en México, por más de 10 años enfocada en proveer compuestos de bio-investigación, factores de crecimiento y soluciones de suplementación avanzada para atletas de alto rendimiento y profesionales del sector experimental. Entendemos las exigencias del deporte de élite y el desarrollo biológico. Por ello, nos comprometemos con la excelencia, ofreciendo exclusivamente productos que cumplen con los más estrictos estándares de pureza, calidad y verificación de laboratorio. Respaldamos el trabajo de atletas de alto nivel y centros de evaluación física con herramientas de vanguardia tecnológica, garantizando un servicio transparente, envíos nacionales seguros y soluciones analíticas de la más alta fidelidad en el mercado.'
