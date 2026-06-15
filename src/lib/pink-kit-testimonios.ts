/**
 * Contenido Testimonios Pink Kit — scrape de https://www.tpharmagold.com/about-1
 * Regenerar: npm run scrape:pink-kit-testimonios
 */

import { wixMediaUrl, wixVideo } from '@/lib/wix-media'

import { ROSE_GOLD } from '@/lib/brand-colors'

export const PINK_KIT_ACCENT = ROSE_GOLD.base

export const PINK_KIT_HERO = {
  poster: wixMediaUrl('98134b_e1e249a920d74cbc895d00d644fc93def001'),
  video: wixVideo('98134b_e1e249a920d74cbc895d00d644fc93de', '1080p'),
}

export const PINK_KIT_PRODUCT = {
  slug: 'combo-beach-peach',
  name: 'Pink Booty Boobs Kit',
  image: wixMediaUrl('98134b_c0c25728181142f3a98ef09a3702f8cd~mv2.jpeg'),
}

/** Tres testimonios destacados (primera sección). */
export const PINK_KIT_FEATURED_IMAGES = [
  {
    id: '98134b_29ec53796b7541f1a035437a918cf66d~mv2.jpeg',
    alt: 'Testimonio Pink Kit 1',
    src: wixMediaUrl('98134b_29ec53796b7541f1a035437a918cf66d~mv2.jpeg'),
  },
  {
    id: '98134b_a8230a3c6b224463b9a8ad9407fa4fa0~mv2.jpeg',
    alt: 'Testimonio Pink Kit 2',
    src: wixMediaUrl('98134b_a8230a3c6b224463b9a8ad9407fa4fa0~mv2.jpeg'),
  },
  {
    id: '98134b_17fd3f8c15924518862a4d6fbae16b33~mv2.jpeg',
    alt: 'Testimonio Pink Kit 3',
    src: wixMediaUrl('98134b_17fd3f8c15924518862a4d6fbae16b33~mv2.jpeg'),
  },
] as const

/** Galería “Nuestras consumidoras” (segunda sección). */
export const PINK_KIT_GALLERY_IMAGES = [
  '98134b_392fb4a64afc4616a6ff26a6617bcf9a~mv2.jpeg',
  '98134b_0152c431274c404d9e04b493bbe5f6b1~mv2.jpeg',
  '98134b_bec845660e3e42d3826094aa5ea83fee~mv2.jpeg',
  '98134b_895a684655634220a4bf33c9cedc3199~mv2.jpeg',
  '98134b_460c34e7071d4bb9a836218de8878392~mv2.jpeg',
  '98134b_49e2a3847bc342d99b8f59cc54ed2410~mv2.jpeg',
  '98134b_a77c92e5288f4aa7ac53a706e1c7e846~mv2.jpeg',
  '98134b_76d2c4fd114a405fa2751e3daabe8bcd~mv2.jpeg',
  '98134b_9d405a8e5db24a69ab368473d23fd4c8~mv2.jpeg',
  '98134b_1f8e14be13974100bb04c88c87bf98c0~mv2.jpeg',
  '98134b_7d106991e90946658273e3a53a69b83f~mv2.jpeg',
  '98134b_511c612f98bf40ba98c379fa80e56fa4~mv2.jpeg',
  '98134b_6d5078e863fb44afa212a8c7f08e06c1~mv2.jpeg',
  '98134b_6f9c2d5054f54141b8b514cbc27beea0~mv2.jpeg',
  '98134b_3d3088a95aef4cee9c3d61f791842159~mv2.jpeg',
  '98134b_f72f11bab7334aa2bf18f181f2f83ce4~mv2.jpeg',
  '98134b_34cd493254064d098b2cae5347f6d209~mv2.jpeg',
  '98134b_c115b2fa20f345af9e2a4298dc015d2c~mv2.jpeg',
] as const

export const PINK_KIT_TRUST_BADGE = '/envios/openpay.png'
