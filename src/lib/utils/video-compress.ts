import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import {
  VIDEO_COMPRESS_PRESET,
  ffmpegScaleFilter,
  preferOriginalIfSimilarSize,
  shouldCompressVideoBytes,
} from '@/lib/utils/video-compress-config'

let ffmpegInstance: FFmpeg | null = null
let ffmpegLoading: Promise<FFmpeg> | null = null

async function getFfmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance
  if (ffmpegLoading) return ffmpegLoading

  ffmpegLoading = (async () => {
    const ffmpeg = new FFmpeg()
    const base = `${window.location.origin}/ffmpeg`
    await ffmpeg.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
    })
    ffmpegInstance = ffmpeg
    return ffmpeg
  })()

  return ffmpegLoading
}

function extFromType(type: string): string {
  if (type.includes('webm')) return 'webm'
  if (type.includes('quicktime')) return 'mov'
  return 'mp4'
}

export function shouldCompressVideo(file: File): boolean {
  return shouldCompressVideoBytes(file.size)
}

export function validateVideoInput(file: File, maxInputMB: number = VIDEO_COMPRESS_PRESET.maxInputMB): void {
  const valid = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg']
  if (!valid.includes(file.type)) {
    throw new Error('Formato no válido. Usa MP4, WebM o MOV.')
  }
  if (file.size > maxInputMB * 1024 * 1024) {
    throw new Error(`El video no puede superar ${maxInputMB} MB.`)
  }
}

/** @deprecated Usa validateVideoInput */
export function validateHomeVideoInput(file: File): void {
  validateVideoInput(file, VIDEO_COMPRESS_PRESET.maxInputMB)
}

export async function compressVideoForWeb(
  file: File,
  onProgress?: (percent: number) => void,
  options?: { maxInputMB?: number },
): Promise<File> {
  validateVideoInput(file, options?.maxInputMB ?? VIDEO_COMPRESS_PRESET.maxInputMB)

  if (!shouldCompressVideo(file)) {
    return file
  }

  const ffmpeg = await getFfmpeg()

  ffmpeg.on('progress', ({ progress }) => {
    if (onProgress && Number.isFinite(progress)) {
      onProgress(Math.min(99, Math.round(progress * 100)))
    }
  })

  const inputExt = extFromType(file.type)
  const inputName = `input.${inputExt}`
  const outputName = 'output.mp4'

  await ffmpeg.writeFile(inputName, await fetchFile(file))
  await ffmpeg.exec([
    '-i', inputName,
    '-vf', ffmpegScaleFilter(VIDEO_COMPRESS_PRESET.maxWidth),
    '-c:v', 'libx264',
    '-preset', VIDEO_COMPRESS_PRESET.preset,
    '-crf', String(VIDEO_COMPRESS_PRESET.crf),
    '-movflags', '+faststart',
    '-c:a', 'aac',
    '-b:a', VIDEO_COMPRESS_PRESET.audioBitrate,
    '-y',
    outputName,
  ])

  const data = await ffmpeg.readFile(outputName)
  const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data))
  const blob = new Blob([Uint8Array.from(bytes)], { type: 'video/mp4' })

  await ffmpeg.deleteFile(inputName).catch(() => {})
  await ffmpeg.deleteFile(outputName).catch(() => {})

  if (preferOriginalIfSimilarSize(file.size, blob.size)) {
    onProgress?.(100)
    return file
  }

  const targetMax = VIDEO_COMPRESS_PRESET.targetMaxMB * 1024 * 1024
  if (blob.size > targetMax) {
    throw new Error(
      `Tras comprimir el video sigue pesando más de ${VIDEO_COMPRESS_PRESET.targetMaxMB} MB. ` +
        'Prueba con un clip más corto o exporta en menor resolución desde tu editor.',
    )
  }

  onProgress?.(100)

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'video'
  return new File([blob], `${baseName}-web.mp4`, { type: 'video/mp4' })
}
