/**
 * Sube un archivo al bucket de Supabase usando una URL firmada del admin.
 * Evita el error de RLS al subir desde el navegador.
 */
export async function uploadFileViaAdminSignedUrl(
  file: File | Blob,
  path: string,
  contentType: string,
): Promise<string> {
  const res = await fetch('/api/admin/storage/signed-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, contentType }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error ?? 'Error al preparar la subida.')
  }

  const uploadRes = await fetch(data.signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  })

  if (!uploadRes.ok) {
    const detail = await uploadRes.text().catch(() => '')
    throw new Error(
      detail
        ? `Error subiendo archivo: ${detail}`
        : `Error subiendo archivo (${uploadRes.status}).`,
    )
  }

  return data.publicUrl as string
}
