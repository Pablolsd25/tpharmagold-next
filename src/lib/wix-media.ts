const WIX_MEDIA = 'https://static.wixstatic.com/media'

/** URL canónica sin transformaciones — Vercel/next/image aplica tamaño y formato. */
export function wixMediaUrl(fileId: string): string {
  const file = fileId.includes('.') ? fileId : `${fileId}.jpg`
  return `${WIX_MEDIA}/${file}`
}

/** @deprecated Usar wixMediaUrl + next/image (optimización Vercel). */
export function wixImage(
  fileId: string,
  _width: number,
  _height: number,
  _quality = 90,
): string {
  return wixMediaUrl(fileId)
}

export function wixVideo(fileId: string, quality: '480p' | '720p' | '1080p' = '1080p'): string {
  return `https://video.wixstatic.com/video/${fileId}/${quality}/mp4/file.mp4`
}

/** Normaliza URLs Wix con /v1/fill/... a la URL base para el optimizador. */
export function canonicalImageUrl(url: string): string {
  if (!url) return url
  if (url.includes('static.wixstatic.com/media/')) {
    const match = url.match(/(https:\/\/static\.wixstatic\.com\/media\/[^/]+)/)
    if (match) return match[1]
  }
  return url
}

/** true si la imagen debe pasar por next/image (Supabase, Wix, etc.). */
export function isOptimizableRemoteImage(url: string): boolean {
  return (
    url.startsWith('/') ||
    url.includes('.supabase.co/storage/') ||
    url.includes('static.wixstatic.com')
  )
}
