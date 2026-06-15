/**
 * Utilidades para gestionar imágenes de productos en Supabase Storage
 * Bucket: 'images'  (bucket principal de imágenes del sitio)
 */

import { createClient } from '@/lib/supabase/client'
import { uploadFileViaAdminSignedUrl } from '@/lib/utils/admin-storage-upload'
import { compressImageForWeb } from '@/lib/utils/image-compress'
import { compressVideoForWeb } from '@/lib/utils/video-compress'

const BUCKET = 'images'

/**
 * Sube una imagen de producto al bucket de Supabase Storage.
 * Comprime automáticamente antes de subir.
 */
export async function uploadProductImage(
  file: File,
  productId: string,
  folder: 'products' | 'products/description' = 'products',
): Promise<string> {
  validateImageFile(file)

  const compressed = await compressImageForWeb(file)
  const ext = 'jpg'
  const fileName = `${productId}_${Date.now()}.${ext}`
  const filePath = `${folder}/${fileName}`

  return uploadFileViaAdminSignedUrl(compressed, filePath, 'image/jpeg')
}

/**
 * Elimina una imagen del bucket si pertenece a Supabase Storage.
 */
export async function deleteProductImage(imageUrl: string): Promise<void> {
  if (!imageUrl || !imageUrl.includes('supabase.co/storage')) return

  const supabase = createClient()
  const parts = imageUrl.split(`/storage/v1/object/public/${BUCKET}/`)
  if (parts.length < 2) return

  const filePath = parts[1].split('?')[0]
  const { error } = await supabase.storage.from(BUCKET).remove([filePath])
  if (error) console.warn('No se pudo eliminar la imagen:', error.message)
}

/**
 * Valida tipo y tamaño del archivo (límite alto; se comprime antes de subir).
 */
export function validateImageFile(file: File, maxSizeMB = 15): void {
  const valid = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  if (!valid.includes(file.type)) {
    throw new Error('Formato no válido. Usa JPG, PNG, WebP o GIF.')
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`La imagen no puede superar ${maxSizeMB} MB.`)
  }
}

const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg']

/**
 * Valida un archivo de media (imagen o video) para la galería.
 */
export function validateMediaFile(file: File): void {
  const isImage = file.type.startsWith('image/')
  const isVideo = VIDEO_TYPES.includes(file.type)
  if (!isImage && !isVideo) {
    throw new Error('Formato no válido. Sube una imagen o un video (MP4, WebM, MOV).')
  }
  const maxMB = isVideo ? 80 : 15
  if (file.size > maxMB * 1024 * 1024) {
    throw new Error(`El archivo no puede superar ${maxMB} MB.`)
  }
}

export type MediaUploadProgress = {
  phase: 'compressing' | 'uploading'
  percent: number
}

/**
 * Sube un archivo de media (imagen o video) a la galería.
 * Comprime automáticamente antes de subir.
 */
export async function uploadMediaFile(
  file: File,
  onProgress?: (progress: MediaUploadProgress) => void,
): Promise<string> {
  validateMediaFile(file)

  const isVideo = file.type.startsWith('video/')
  let prepared = file

  if (isVideo) {
    onProgress?.({ phase: 'compressing', percent: 0 })
    prepared = await compressVideoForWeb(
      file,
      (percent) => onProgress?.({ phase: 'compressing', percent }),
      { maxInputMB: 80 },
    )
  } else {
    onProgress?.({ phase: 'compressing', percent: 50 })
    prepared = await compressImageForWeb(file)
    onProgress?.({ phase: 'compressing', percent: 100 })
  }

  onProgress?.({ phase: 'uploading', percent: 0 })

  const folder = isVideo ? 'videos' : 'products'
  const ext = isVideo ? 'mp4' : 'jpg'
  const base = prepared.name.replace(/\.[^.]+$/, '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'media'
  const filePath = `${folder}/${base}_${Date.now()}.${ext}`
  const contentType = isVideo ? 'video/mp4' : 'image/jpeg'

  const url = await uploadFileViaAdminSignedUrl(prepared, filePath, contentType)
  onProgress?.({ phase: 'uploading', percent: 100 })
  return url
}
