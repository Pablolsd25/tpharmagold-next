import sharp from 'sharp'

export type ServerImageCompressOptions = {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  skipBelowBytes?: number
}

const DEFAULTS = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 82,
  skipBelowBytes: 300_000,
}

export type CompressedImage = {
  buffer: Buffer
  contentType: 'image/jpeg'
  extension: 'jpg'
  beforeBytes: number
  afterBytes: number
}

/**
 * Comprime un buffer de imagen con sharp (scripts / migraciones).
 */
export async function compressImageBuffer(
  input: Buffer,
  options?: ServerImageCompressOptions,
): Promise<CompressedImage> {
  const opts = { ...DEFAULTS, ...options }
  const beforeBytes = input.length

  const meta = await sharp(input).metadata()
  const width = meta.width ?? 0
  const height = meta.height ?? 0

  const alreadyOptimized =
    beforeBytes <= opts.skipBelowBytes &&
    meta.format === 'jpeg' &&
    width <= opts.maxWidth &&
    height <= opts.maxHeight

  if (alreadyOptimized) {
    return {
      buffer: input,
      contentType: 'image/jpeg',
      extension: 'jpg',
      beforeBytes,
      afterBytes: beforeBytes,
    }
  }

  let pipeline = sharp(input, { animated: false }).rotate()

  if (width > opts.maxWidth || height > opts.maxHeight) {
    pipeline = pipeline.resize({
      width: opts.maxWidth,
      height: opts.maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    })
  }

  const buffer = await pipeline
    .jpeg({ quality: opts.quality, mozjpeg: true })
    .toBuffer()

  if (buffer.length >= beforeBytes * 0.95) {
    return {
      buffer: input,
      contentType: 'image/jpeg',
      extension: 'jpg',
      beforeBytes,
      afterBytes: beforeBytes,
    }
  }

  return {
    buffer,
    contentType: 'image/jpeg',
    extension: 'jpg',
    beforeBytes,
    afterBytes: buffer.length,
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
