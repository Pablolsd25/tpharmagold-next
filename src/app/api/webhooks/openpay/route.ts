import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─────────────────────────────────────────────────────────────────────────────
// Configuración OpenPay
// ─────────────────────────────────────────────────────────────────────────────
const OPENPAY_API = process.env.NEXT_PUBLIC_OPENPAY_SANDBOX === 'true'
  ? 'https://sandbox-api.openpay.mx/v1'
  : 'https://api.openpay.mx/v1'

const MERCHANT_ID = process.env.NEXT_PUBLIC_OPENPAY_MERCHANT_ID!
const PRIVATE_KEY  = process.env.OPENPAY_PRIVATE_KEY!

function authHeader() {
  return 'Basic ' + Buffer.from(`${PRIVATE_KEY}:`).toString('base64')
}

// ─────────────────────────────────────────────────────────────────────────────
// Re-consulta el cargo directamente en OpenPay para verificar su estado real
// (previene que cualquiera falsifique un webhook con un POST manual)
// ─────────────────────────────────────────────────────────────────────────────
async function fetchCharge(transactionId: string) {
  try {
    const res = await fetch(
      `${OPENPAY_API}/${MERCHANT_ID}/charges/${transactionId}`,
      { headers: { Authorization: authHeader() } }
    )
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: registrar evento en webhook_events (best-effort, no bloquea)
// ─────────────────────────────────────────────────────────────────────────────
async function logWebhookEvent(
  supabase: ReturnType<typeof createAdminClient>,
  payload: {
    event_type:     string
    transaction_id: string | null
    raw_payload:    Record<string, unknown>
    order_id?:      string | null
    status:         'received' | 'processed' | 'ignored' | 'error'
    error_message?: string
  }
): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('webhook_events')
      .insert(payload)
      .select('id')
      .single()
    return data?.id ?? null
  } catch {
    // La tabla puede no existir todavía (migración pendiente) — no bloqueamos
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: actualizar estado del log (best-effort)
// ─────────────────────────────────────────────────────────────────────────────
async function updateWebhookLog(
  supabase: ReturnType<typeof createAdminClient>,
  logId: string,
  update: { status: 'processed' | 'ignored' | 'error'; error_message?: string; order_id?: string | null }
) {
  try {
    await supabase.from('webhook_events').update(update).eq('id', logId)
  } catch { /* silencioso */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/webhooks/openpay
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  let logId: string | null = null
  let body: Record<string, unknown> = {}

  try {
    body = await req.json()
    const { type, data } = body as { type: string; data?: { object?: { id?: string } } }

    const transactionId = (data?.object?.id as string) ?? null

    // ── 1. Registrar evento recibido (auditoría) ─────────────────────────────
    logId = await logWebhookEvent(supabase, {
      event_type:     type,
      transaction_id: transactionId,
      raw_payload:    body,
      status:         'received',
    })

    // Sin tipo de evento — ignorar
    if (!type) {
      if (logId) await updateWebhookLog(supabase, logId, { status: 'ignored' })
      return NextResponse.json({ received: true })
    }

    // ── 2. Procesar según tipo de evento ─────────────────────────────────────

    // ── charge.succeeded ─────────────────────────────────────────────────────
    if (type === 'charge.succeeded') {
      if (!transactionId) {
        if (logId) await updateWebhookLog(supabase, logId, { status: 'ignored' })
        return NextResponse.json({ received: true })
      }

      // Verificar contra OpenPay antes de marcar como pagado
      const charge = await fetchCharge(transactionId)
      if (charge?.status === 'completed') {
        const { data: updatedOrder } = await supabase
          .from('orders')
          .update({ status: 'paid' })
          .eq('openpay_transaction_id', transactionId)
          .select('id')
          .single()

        if (logId) {
          await updateWebhookLog(supabase, logId, {
            status:   'processed',
            order_id: updatedOrder?.id ?? null,
          })
        }
      } else {
        console.warn('[webhook] charge.succeeded pero OpenPay reporta status:', charge?.status)
        if (logId) await updateWebhookLog(supabase, logId, {
          status:        'error',
          error_message: `OpenPay status inesperado: ${charge?.status ?? 'null'}`,
        })
      }

    // ── charge.failed ─────────────────────────────────────────────────────────
    } else if (type === 'charge.failed') {
      if (!transactionId) {
        if (logId) await updateWebhookLog(supabase, logId, { status: 'ignored' })
        return NextResponse.json({ received: true })
      }

      const charge = await fetchCharge(transactionId)
      if (charge && charge.status !== 'completed') {
        const { data: updatedOrder } = await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('openpay_transaction_id', transactionId)
          .select('id')
          .single()

        if (logId) {
          await updateWebhookLog(supabase, logId, {
            status:   'processed',
            order_id: updatedOrder?.id ?? null,
          })
        }
      } else {
        if (logId) await updateWebhookLog(supabase, logId, { status: 'ignored' })
      }

    // ── charge.cancelled ──────────────────────────────────────────────────────
    } else if (type === 'charge.cancelled') {
      if (!transactionId) {
        if (logId) await updateWebhookLog(supabase, logId, { status: 'ignored' })
        return NextResponse.json({ received: true })
      }

      const { data: updatedOrder } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('openpay_transaction_id', transactionId)
        .select('id')
        .single()

      if (logId) {
        await updateWebhookLog(supabase, logId, {
          status:   'processed',
          order_id: updatedOrder?.id ?? null,
        })
      }

    // ── charge.refunded ───────────────────────────────────────────────────────
    } else if (type === 'charge.refunded') {
      if (!transactionId) {
        if (logId) await updateWebhookLog(supabase, logId, { status: 'ignored' })
        return NextResponse.json({ received: true })
      }

      const { data: updatedOrder } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('openpay_transaction_id', transactionId)
        .select('id')
        .single()

      if (logId) {
        await updateWebhookLog(supabase, logId, {
          status:   'processed',
          order_id: updatedOrder?.id ?? null,
        })
      }

    // ── charge.chargeback.accepted ────────────────────────────────────────────
    // El banco aceptó el contracargo — el dinero ya volvió al cliente
    } else if (type === 'charge.chargeback.accepted') {
      if (!transactionId) {
        if (logId) await updateWebhookLog(supabase, logId, { status: 'ignored' })
        return NextResponse.json({ received: true })
      }

      const { data: updatedOrder } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('openpay_transaction_id', transactionId)
        .select('id')
        .single()

      console.warn('[webhook] CHARGEBACK ACEPTADO para transacción:', transactionId, '— orden:', updatedOrder?.id)

      if (logId) {
        await updateWebhookLog(supabase, logId, {
          status:        'processed',
          order_id:      updatedOrder?.id ?? null,
          error_message: 'Contracargo aceptado — fondos devueltos al cliente por el banco.',
        })
      }

    // ── charge.chargeback.in_review ───────────────────────────────────────────
    // El banco inició un proceso de contracargo — en investigación
    // No cambiamos el status de la orden aún; solo lo registramos
    } else if (type === 'charge.chargeback.in_review') {
      console.warn('[webhook] CHARGEBACK EN REVISIÓN para transacción:', transactionId)

      // Buscar la orden para asociarla en el log
      const { data: order } = transactionId
        ? await supabase
            .from('orders')
            .select('id')
            .eq('openpay_transaction_id', transactionId)
            .single()
        : { data: null }

      if (logId) {
        await updateWebhookLog(supabase, logId, {
          status:        'processed',
          order_id:      order?.id ?? null,
          error_message: 'Contracargo en revisión — pendiente resolución del banco.',
        })
      }

    // ── Eventos no manejados (payout, subscription, etc.) ─────────────────────
    } else {
      console.log('[webhook] Evento no manejado:', type)
      if (logId) await updateWebhookLog(supabase, logId, { status: 'ignored' })
    }

    return NextResponse.json({ received: true })

  } catch (err) {
    console.error('[webhook] Error inesperado:', err)
    if (logId) {
      await updateWebhookLog(supabase, logId, {
        status:        'error',
        error_message: String(err),
      })
    } else {
      // Si ni siquiera pudo parsear el body, intentar logear de todas formas
      await logWebhookEvent(supabase, {
        event_type:     'unknown',
        transaction_id: null,
        raw_payload:    body,
        status:         'error',
        error_message:  String(err),
      })
    }
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }
}
