import { DEFAULT_HOME_VIDEO_480, DEFAULT_HOME_VIDEO_POSTER } from '@/lib/home-video'
import { wixMediaUrl, wixVideo } from '@/lib/wix-media'

/** Imágenes de autenticidad — Wix /sobre-nosotros */
export const ABOUT_SECURITY_IMAGES = [
  {
    id: '98134b_6484c0da12494c1e8c589bd29be6d009~mv2.jpg',
    alt: 'Holograma de seguridad T Pharma Gold',
    caption: 'Holograma de seguridad',
  },
  {
    id: '98134b_7ae6044b36e1493db4c711232332a2d2~mv2.jpg',
    alt: 'Código de autenticación y logotipo T Pharma Gold',
    caption: 'Verificación de autenticidad',
  },
] as const

export const ABOUT_VIDEOS = [
  {
    id: 'about-brand',
    title: 'T Pharma Gold',
    subtitle: 'El mejor complemento para atletas',
    src: DEFAULT_HOME_VIDEO_480,
    poster: DEFAULT_HOME_VIDEO_POSTER,
  },
] as const

export function aboutImageUrl(fileId: string): string {
  return wixMediaUrl(fileId)
}

/** Fallback Wix CDN si Supabase no está configurado */
export const ABOUT_WIX_HERO_VIDEO = wixVideo('98134b_6dd464ad60084e9aae7151a182b7f2fc', '480p')
