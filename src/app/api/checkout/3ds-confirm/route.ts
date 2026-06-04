import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fulfillPaidOrder } from '@/lib/checkout-fulfillment'
import { getOpenPayError } from '@/lib/openpay-errors'
import { openpayFetch } from '@/lib/openpay-server'

function splitCustomerName(full: string | null): { firstName: string; lastName: string } {
  const trimmed = (full ?? '').trim()
  if (!trimmed) return { firstName: 'Cliente', lastName: '' }
  const space = trimmed.indexOf(' ')
  if (space === -1) return { firstName: trimmed, lastName: '' }
  return {
    firstName: trimmed.slice(0, space),
    lastName:  trimmed.slice(space + 1),
  }
}

// GET /api/checkout/3ds-confirm?chargeId=… — Paso 8 del flujo 3D Secure (Openpay)
export async function GET(req: NextRequest) {
  try {
    const chargeId = req.nextUrl.searchParams.get('chargeId')?.trim()
    if (!chargeId) {
      return NextResponse.json({ error: 'Falta el identificador del cargo.' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(
        `id, status, profile_id, subtotal, shipping_cost, discount, total, coupon_code,
         customer_email, customer_name, shipping_address,
         items:order_items(product_id, quantity, unit_price, product:products(name))`
      )
      .eq('openpay_transaction_id', chargeId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Orden no encontrada.' }, { status: 404 })
    }

    if (order.status === 'paid') {
      return NextResponse.json({
        orderId:  order.id,
        status:   'paid',
        email:    order.customer_email,
        loggedIn: !!order.profile_id,
      })
    }

    const openpayRes = await openpayFetch(`/charges/${encodeURIComponent(chargeId)}`)
    const charge = await openpayRes.json()

    if (!openpayRes.ok) {
      console.error('[3ds-confirm] OpenPay GET charge failed:', charge)
      return NextResponse.json(
        { error: getOpenPayError(charge) },
        { status: 502 }
      )
    }

    console.log('[3ds-confirm] charge status:', charge.status, '| order:', order.id)

    if (charge.status === 'completed') {
      await supabase.from('orders').update({ status: 'paid' }).eq('id', order.id)

      const { firstName, lastName } = splitCustomerName(order.customer_name)
      const rawAddr = (order.shipping_address ?? {}) as Record<string, string | undefined>
      const shippingAddress = {
        street:      rawAddr.street ?? '',
        numExterior: rawAddr.numExterior,
        numInterior: rawAddr.numInterior,
        referencias: rawAddr.referencias,
        colonia:     rawAddr.colonia,
        municipio:   rawAddr.municipio,
        city:        rawAddr.city,
        state:       rawAddr.state ?? '',
        zip:         rawAddr.zip ?? '',
        country:     rawAddr.country,
      }

      const items = (order.items ?? []).map((row) => {
        const product = row.product as { name?: string } | { name?: string }[] | null
        const name = Array.isArray(product)
          ? product[0]?.name
          : product?.name
        return {
          productId: row.product_id as string,
          name:      name ?? 'Producto',
          quantity:  row.quantity as number,
          price:     row.unit_price as number,
        }
      })

      await fulfillPaidOrder(supabase, {
        orderId:         order.id,
        profileId:       order.profile_id,
        items,
        customer: {
          firstName,
          lastName,
          email: order.customer_email ?? '',
          phone: '',
        },
        shippingAddress,
        subtotal:        order.subtotal,
        shippingCost:    order.shipping_cost,
        total:           order.total,
        validCouponCode: order.coupon_code,
        productIds:      items.map((i) => i.productId),
      })

      return NextResponse.json({
        orderId:  order.id,
        status:   'paid',
        email:    order.customer_email,
        loggedIn: !!order.profile_id,
      })
    }

    if (charge.status === 'in_progress') {
      return NextResponse.json({
        orderId:  order.id,
        status:   'pending',
        email:    order.customer_email,
        loggedIn: !!order.profile_id,
      })
    }

    if (charge.status === 'charge_pending') {
      return NextResponse.json({
        orderId:  order.id,
        status:   'pending',
        pending3ds: true,
        email:    order.customer_email,
        loggedIn: !!order.profile_id,
      })
    }

    if (charge.status === 'failed') {
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
      return NextResponse.json({
        orderId:  order.id,
        status:   'failed',
        error:    getOpenPayError(charge),
        email:    order.customer_email,
        loggedIn: !!order.profile_id,
      })
    }

    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
    return NextResponse.json({
      orderId:  order.id,
      status:   'failed',
      error:    getOpenPayError(charge),
      email:    order.customer_email,
      loggedIn: !!order.profile_id,
    })
  } catch (err) {
    console.error('[3ds-confirm] Error:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
