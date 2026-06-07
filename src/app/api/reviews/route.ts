import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit'

const MAX_NAME = 100
const MAX_EMAIL = 254
const MAX_TITLE = 200
const MAX_COMMENT = 2000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function trimField(value: unknown, max: number): string | null {
  if (value == null) return null
  const s = String(value).trim()
  if (!s) return null
  return s.slice(0, max)
}

export async function POST(req: NextRequest) {
  try {
    const rate = await checkRateLimit('reviews', req)
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Demasiadas reseñas enviadas. Intenta más tarde.' },
        { status: 429, headers: rateLimitHeaders(rate) },
      )
    }

    const body = await req.json()
    const productId = trimField(body.product_id, 36)
    const reviewerName = trimField(body.reviewer_name, MAX_NAME)
    const reviewerEmail = trimField(body.reviewer_email, MAX_EMAIL)
    const title = trimField(body.title, MAX_TITLE)
    const comment = trimField(body.comment, MAX_COMMENT)
    const rating = Number(body.rating)

    if (!productId || !reviewerName || !reviewerEmail || !comment) {
      return NextResponse.json({ error: 'Completa todos los campos requeridos.' }, { status: 400 })
    }

    if (!EMAIL_RE.test(reviewerEmail)) {
      return NextResponse.json({ error: 'Correo electrónico inválido.' }, { status: 400 })
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Selecciona una calificación de 1 a 5 estrellas.' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('is_active', true)
      .maybeSingle()

    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 404 })
    }

    const { error } = await supabase.from('reviews').insert({
      product_id: productId,
      reviewer_name: reviewerName,
      reviewer_email: reviewerEmail,
      rating,
      title,
      comment,
      is_approved: false,
    })

    if (error) {
      console.error('[api/reviews]', error)
      return NextResponse.json({ error: 'No se pudo enviar la reseña.' }, { status: 500 })
    }

    return NextResponse.json(
      { ok: true, message: 'Gracias. Tu reseña será publicada después de revisión.' },
      { headers: rateLimitHeaders(rate) },
    )
  } catch (err) {
    console.error('[api/reviews]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
