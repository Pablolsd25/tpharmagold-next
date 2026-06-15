import type { SupabaseClient } from '@supabase/supabase-js'
import { wixMediaUrl } from '@/lib/wix-media'

const SUPABASE_MEDIA = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images`

/** Video gym — Supabase Storage (migrado desde Wix) */
export const DEFAULT_HOME_VIDEO_480 = `${SUPABASE_MEDIA}/videos/home-hero-480.mp4`

export const DEFAULT_HOME_VIDEO_1080 = DEFAULT_HOME_VIDEO_480

export const DEFAULT_HOME_VIDEO_POSTER = `${SUPABASE_MEDIA}/videos/home-hero-poster.jpg`

/** Imagen bodybuilder — sección "Ganamos Competencias" (Wix oficial) */
export const WIX_HOME_SHOWCASE_IMAGE = wixMediaUrl(
  '98134b_dbacde3932e040b1a07b7d51fdf28381~mv2.jpeg',
)

/** Ruta Supabase tras npm run migrate:home-media */
export const DEFAULT_HOME_SHOWCASE_IMAGE = `${SUPABASE_MEDIA}/products/home-showcase.jpg`

export const DEFAULT_HOME_SHOWCASE_VIDEO = ''

export type HomeVideoSettings = {
  video480: string
  video1080: string
}

export type HomePageVideos = HomeVideoSettings & {
  showcaseVideo: string
}

const SETTINGS_KEYS = [
  'home_video_480',
  'home_video_1080',
  'home_showcase_video',
  'home_showcase_image',
] as const

const WIX_MEDIA_MARKERS = ['wixstatic.com', 'video.wixstatic.com', 'd60565_', '5cd3e7_']

/** Logo subido por error como showcase (701022_755208ed…). */
const WRONG_SHOWCASE_MARKERS = ['701022_755208ed', 'logo.jpg', '/logo.']

function isWrongShowcase(url: string | undefined): boolean {
  if (!url) return false
  return WRONG_SHOWCASE_MARKERS.some((m) => url.includes(m))
}

function isWixMedia(url: string | undefined): boolean {
  if (!url) return true
  return WIX_MEDIA_MARKERS.some((m) => url.includes(m))
}

function resolveMediaUrl(url: string | undefined, fallback: string): string {
  if (!url || isWixMedia(url)) return fallback
  return url
}

export async function getHomeVideoSettings(
  supabase: SupabaseClient
): Promise<HomeVideoSettings> {
  const all = await getHomePageVideos(supabase)
  return { video480: all.video480, video1080: all.video1080 }
}

export async function getHomePageVideos(
  supabase: SupabaseClient
): Promise<HomePageVideos> {
  const { data } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', [...SETTINGS_KEYS])

  const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]))

  const showcaseRaw = map.home_showcase_video
  const showcaseVideo =
    showcaseRaw && !isWixMedia(showcaseRaw) ? showcaseRaw : DEFAULT_HOME_SHOWCASE_VIDEO

  return {
    video480: resolveMediaUrl(map.home_video_480, DEFAULT_HOME_VIDEO_480),
    video1080: resolveMediaUrl(map.home_video_1080, DEFAULT_HOME_VIDEO_1080),
    showcaseVideo,
  }
}

export async function getHomeShowcaseImage(
  supabase: SupabaseClient
): Promise<string> {
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'home_showcase_image')
    .maybeSingle()

  const raw = data?.value
  if (!raw || isWixMedia(raw) || isWrongShowcase(raw)) {
    return WIX_HOME_SHOWCASE_IMAGE
  }
  return raw
}
