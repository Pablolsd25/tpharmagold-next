import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendShippingNotification } from '@/lib/email/templates'

// PATCH /api/admin/orders/[id] — actualizar status o tracking_number
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // ── Auth ──────────────────────────────────────────────────────────────────
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // ── Guard de rol admin ────────────────────────────────────────────────────
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)

  if (adminEmails.length > 0 && !adminEmails.includes(user.email ?? '')) {
    console.warn(`[admin] Acceso denegado para: ${user.email}`)
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }
  // ─────────────────────────────────────────────────────────────────────────

  const supabase = createAdminClient()
  const body = await req.json()
  const { status, tracking_number } = body

  // ── Actualizar tracking_number (sin cambiar status) ───────────────────────
  if (tracking_number !== undefined && status === undefined) {
    const { data: order, error } = await supabase
      .from('orders')
      .update({ tracking_number: tracking_number || null })
      .eq('id', id)
      .select()
      .single()
    if (error || !order) return NextResponse.json({ error: error?.message ?? 'Error' }, { status: 400 })
    return NextResponse.json(order)
  }

  // ── Actualizar status ─────────────────────────────────────────────────────
  const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  // ── Actualizar orden ──────────────────────────────────────────────────────
  const { data: order, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select('*, items:order_items(unit_price, quantity, product:products(name))')
    .single()

  if (error || !order) {
    return NextResponse.json({ error: error?.message ?? 'Error al actualizar' }, { status: 400 })
  }

  // ── Disparar email de envío cuando pasa a "shipped" ───────────────────────
  if (status === 'shipped' && order.customer_email) {
    try {
      const addr = order.shipping_address as {
        street?: string; city?: string; state?: string; zip?: string; country?: string
      } | null

      await sendShippingNotification({
        to:             order.customer_email,
        orderId:        order.id,
        name:           order.customer_email,   // nombre del cliente (usamos email como fallback)
        trackingNumber: order.tracking_number ?? undefined,
        shippingAddress: addr ? {
          street:  addr.street  ?? '',
          city:    addr.city    ?? '',
          state:   addr.state   ?? '',
          zip:     addr.zip     ?? '',
          country: addr.country ?? 'México',
        } : undefined,
      })

      console.log('[admin] Email de envío enviado a:', order.customer_email)
    } catch (emailErr) {
      // No bloqueamos la respuesta si el email falla
      console.warn('[admin] Error al enviar email de envío:', emailErr)
    }
  }

  return NextResponse.json(order)
}
