import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAccess } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'images'
const ALLOWED_PREFIXES = ['videos/', 'products/', 'products/description/', 'blog/']

/** POST /api/admin/storage/signed-upload — URL firmada para subir archivos al bucket (bypass RLS) */
export async function POST(req: NextRequest) {
  const denied = await checkAdminAccess()
  if (denied) return denied

  const body = await req.json().catch(() => ({}))
  const path = typeof body.path === 'string' ? body.path.trim() : ''

  if (!path) {
    return NextResponse.json({ error: 'Falta el path.' }, { status: 400 })
  }

  if (!ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return NextResponse.json({ error: 'Ruta no permitida.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path, { upsert: false })

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'No se pudo crear la URL de subida.' },
      { status: 400 },
    )
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)

  return NextResponse.json({
    signedUrl: data.signedUrl,
    path: data.path,
    publicUrl: pub.publicUrl,
  })
}
