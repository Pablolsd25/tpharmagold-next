import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendOrderConfirmation } from '@/lib/email/templates'

const OPENPAY_API = process.env.NEXT_PUBLIC_OPENPAY_SANDBOX === 'true'
  ? 'https://sandbox-api.openpay.mx/v1'
  : 'https://api.openpay.mx/v1'

const MERCHANT_ID  = process.env.NEXT_PUBLIC_OPENPAY_MERCHANT_ID!
const PRIVATE_KEY  = process.env.OPENPAY_PRIVATE_KEY!

function authHeader() {
  return 'Basic ' + Buffer.from(`${PRIVATE_KEY}:`).toString('base64')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, deviceSessionId, amount, items, customer, shippingAddress } = body

    if (!token || !amount || !items?.length) {
      return NextResponse.json({ error: 'Datos incompletos.' }, { status: 400 })
    }

    // 0. Obtener usuario autenticado si existe (para guardar profile_id)
    const serverClient = await createClient()
    const { data: { user } } = await serverClient.auth.getUser()
    const profileId = user?.id ?? null

    // 1. Crear cargo en OpenPay
    const chargeBody = {
      source_id:         token,
      method:            'card',
      amount:            parseFloat(amount.toFixed(2)),
      currency:          'MXN',
      description:       `Compra Empire Nutrition`,
      device_session_id: deviceSessionId,
      customer: {
        name:         customer.firstName,
        last_name:    customer.lastName,
        email:        customer.email,
        phone_number: customer.phone,
      },
    }

    const openpayRes = await fetch(`${OPENPAY_API}/${MERCHANT_ID}/charges`, {
      method:  'POST',
      headers: { 'Authorization': authHeader(), 'Content-Type': 'application/json' },
      body:    JSON.stringify(chargeBody),
    })

    const charge = await openpayRes.json()

    if (!openpayRes.ok) {
      const msg = charge.description ?? charge.error_code ?? 'Pago rechazado.'
      return NextResponse.json({ error: msg }, { status: 402 })
    }

    if (charge.status !== 'completed') {
      return NextResponse.json({ error: 'El pago no fue aprobado.' }, { status: 402 })
    }

    // 2. Guardar orden en Supabase (service_role bypasea RLS)
    const supabase = createAdminClient()

    const subtotal     = items.reduce((acc: number, i: { price: number; quantity: number }) => acc + i.price * i.quantity, 0)
    const shippingCost = 99
    const total        = subtotal + shippingCost

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        profile_id:             profileId,
        status:                 'paid',
        subtotal,
        shipping_cost:          shippingCost,
        total,
        openpay_transaction_id: charge.id,
        shipping_address:       shippingAddress,
        customer_email:         customer.email,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Error guardando orden:', orderError)
      return NextResponse.json({ orderId: charge.id, openpayId: charge.id })
    }

    // 3. Guardar items de la orden
    const orderItems = items.map((i: { productId: string; quantity: number; price: number; name?: string }) => ({
      order_id:   order.id,
      product_id: i.productId,
      quantity:   i.quantity,
      unit_price: i.price,
    }))

    await supabase.from('order_items').insert(orderItems)

    // 4. Enviar correo de confirmación (no-op si falta RESEND_API_KEY)
    try {
      await sendOrderConfirmation({
        to:       customer.email,
        orderId:  order.id,
        items,
        subtotal,
        shipping: shippingCost,
        total,
        name:     `${customer.firstName} ${customer.lastName}`,
      })
    } catch (emailErr) {
      console.warn('Email no enviado:', emailErr)
    }

    return NextResponse.json({ orderId: order.id, openpayId: charge.id })
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
