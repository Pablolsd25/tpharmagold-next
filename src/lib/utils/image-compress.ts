export type ImageCompressOptions = {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  /** No comprimir si ya es liviana (bytes). */
  skipBelowBytes?: number
}

const DEFAULTS = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.82,
  skipBelowBytes: 300_000,
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen.'))
    }
    img.src = url
  })
}

function scaledSize(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1)
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  }
}

/**
 * Comprime imágenes en el navegador antes de subirlas a Storage.
 * GIF y SVG se dejan sin cambios.
 */
export async function compressImageForWeb(
  file: File,
  options?: ImageCompressOptions,
): Promise<File> {
  const opts = { ...DEFAULTS, ...options }

  if (!file.type.startsWith('image/')) return file
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file
  if (file.size <= opts.skipBelowBytes && file.type === 'image/jpeg') return file

  const img = await loadImageFromFile(file)
  const { width, height } = scaledSize(
    img.naturalWidth,
    img.naturalHeight,
    opts.maxWidth,
    opts.maxHeight,
  )

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return file

  ctx.drawImage(img, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', opts.quality)
  })

  if (!blob) return file

  // Si no hubo ahorro significativo, conservar original
  if (blob.size >= file.size * 0.92 && file.type === 'image/jpeg') return file

  const base = file.name.replace(/\.[^.]+$/, '') || 'image'
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
