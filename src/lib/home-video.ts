import type { SupabaseClient } from '@supabase/supabase-js'

/** ID del video gym oficial en tpharmagold.com (Wix) */
export const TPHARMA_HOME_VIDEO_ID = '98134b_6dd464ad60084e9aae7151a182b7f2fc'

const WIX_VIDEO_BASE = `https://video.wixstatic.com/video/${TPHARMA_HOME_VIDEO_ID}`

/** Video gym — sección superior de tpharmagold.com */
export const DEFAULT_HOME_VIDEO_480 = `${WIX_VIDEO_BASE}/480p/mp4/file.mp4`

/** Solo existe 480p en el CDN de Wix para este asset */
export const DEFAULT_HOME_VIDEO_1080 = DEFAULT_HOME_VIDEO_480

export const DEFAULT_HOME_VIDEO_POSTER =
  `https://static.wixstatic.com/media/${TPHARMA_HOME_VIDEO_ID}f000.jpg/v1/fill/w_1920,h_1080,al_c,q_85/${TPHARMA_HOME_VIDEO_ID}f000.jpg`

/** Imagen bodybuilder — sección "Ganamos Competencias / Transforma tu entrenamiento" */
export const DEFAULT_HOME_SHOWCASE_IMAGE =
  'https://static.wixstatic.com/media/701022_755208ed4a724527a67774ec2545d78c~mv2.jpg/v1/fit/w_900,h_900,al_c,q_85/701022_755208ed4a724527a67774ec2545d78c~mv2.jpg'

/** Sin video Empire — la home usa imagen en GanamosBanner */
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
] as const

const LEGACY_EMPIRE_VIDEO_MARKERS = ['d60565_', '5cd3e7_a1bdec1e652044e2bae0b70b3d022289']

function isLegacyEmpireVideo(url: string | undefined): boolean {
  if (!url) return true
  return LEGACY_EMPIRE_VIDEO_MARKERS.some((m) => url.includes(m))
}

function resolveHomeVideo(url: string | undefined, fallback: string): string {
  if (!url || isLegacyEmpireVideo(url)) return fallback
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
    showcaseRaw && !isLegacyEmpireVideo(showcaseRaw) ? showcaseRaw : DEFAULT_HOME_SHOWCASE_VIDEO

  return {
    video480: resolveHomeVideo(map.home_video_480, DEFAULT_HOME_VIDEO_480),
    video1080: resolveHomeVideo(map.home_video_1080, DEFAULT_HOME_VIDEO_1080),
    showcaseVideo,
  }
}
