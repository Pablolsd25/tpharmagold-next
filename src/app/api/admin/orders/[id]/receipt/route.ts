import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAccess } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildOrderReceiptPdf, type ReceiptOrder } from '@/lib/order-receipt-pdf'
import { formatOrderNumber } from '@/lib/order-number'

/** GET /api/admin/orders/[id]/receipt — descarga recibo PDF (no factura fiscal) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await checkAdminAccess()
  if (denied) return denied

  const { id } = await params
  const supabase = createAdminClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      id, wix_order_number, created_at, status,
      customer_name, customer_email,
      subtotal, shipping_cost, discount, total, coupon_code,
      openpay_transaction_id, tracking_number, shipping_address,
      items:order_items(quantity, unit_price, name, product:products(name))
    `)
    .eq('id', id)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Orden no encontrada.' }, { status: 404 })
  }

  const items = (order.items ?? []).map((row) => {
    const product = row.product as { name?: string } | { name?: string }[] | null
    const productName = Array.isArray(product) ? product[0]?.name : product?.name
    return {
      name: row.name ?? productName ?? 'Producto',
      quantity: row.quantity as number,
      unit_price: Number(row.unit_price),
    }
  })

  const receiptOrder: ReceiptOrder = {
    id: order.id,
    wix_order_number: order.wix_order_number,
    created_at: order.created_at,
    status: order.status,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    subtotal: Number(order.subtotal),
    shipping_cost: Number(order.shipping_cost ?? 0),
    discount: Number(order.discount ?? 0),
    total: Number(order.total),
    coupon_code: order.coupon_code,
    openpay_transaction_id: order.openpay_transaction_id,
    tracking_number: order.tracking_number,
    shipping_address: order.shipping_address as Record<string, string> | null,
    items,
  }

  const pdf = buildOrderReceiptPdf(receiptOrder)
  const shortId = formatOrderNumber(order, { withHash: false })

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="recibo-${shortId}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
