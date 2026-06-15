/**
 * Preset de compresión de video — calidad decente para web (no máxima, no agresiva).
 *
 * CRF 23 ≈ buena calidad visible en móvil/desktop.
 * 1920px mantiene Full HD; solo baja resolución si el original es mayor.
 */
export const VIDEO_COMPRESS_PRESET = {
  maxWidth: 1920,
  crf: 23,
  preset: 'fast',
  audioBitrate: '160k',
  /** Solo comprimir si supera este peso (evita re-codificar clips ya livianos). */
  compressAboveMB: 22,
  /** Tope tras comprimir (clips largos de producto). */
  targetMaxMB: 100,
  maxInputMB: 500,
} as const

/** Hero de portada: un poco más liviano, sigue viéndose bien de fondo. */
export const VIDEO_HERO_PRESET = {
  maxWidth: 1280,
  crf: 23,
  preset: 'fast',
  audio: false as const,
} as const

export function ffmpegScaleFilter(maxWidth: number): string {
  return `scale='min(${maxWidth},iw)':-2`
}

export function buildFfmpegCompressArgs(
  inputPath: string,
  outputPath: string,
  options?: {
    maxWidth?: number
    crf?: number
    preset?: string
    audioBitrate?: string
    includeAudio?: boolean
  },
): string[] {
  const maxWidth = options?.maxWidth ?? VIDEO_COMPRESS_PRESET.maxWidth
  const crf = options?.crf ?? VIDEO_COMPRESS_PRESET.crf
  const preset = options?.preset ?? VIDEO_COMPRESS_PRESET.preset
  const includeAudio = options?.includeAudio ?? true

  const args = [
    '-i', inputPath,
    '-vf', ffmpegScaleFilter(maxWidth),
    '-c:v', 'libx264',
    '-preset', preset,
    '-crf', String(crf),
    '-movflags', '+faststart',
  ]

  if (includeAudio) {
    args.push('-c:a', 'aac', '-b:a', options?.audioBitrate ?? VIDEO_COMPRESS_PRESET.audioBitrate)
  } else {
    args.push('-an')
  }

  args.push('-y', outputPath)
  return args
}

export function shouldCompressVideoBytes(sizeBytes: number): boolean {
  return sizeBytes > VIDEO_COMPRESS_PRESET.compressAboveMB * 1024 * 1024
}

/** Si la compresión casi no reduce tamaño, conservar el original. */
export function preferOriginalIfSimilarSize(originalBytes: number, compressedBytes: number): boolean {
  return compressedBytes >= originalBytes * 0.9
}
