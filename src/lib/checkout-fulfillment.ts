import type { createAdminClient } from '@/lib/supabase/admin'
import { sendOrderConfirmation } from '@/lib/email/templates'

type Supabase = ReturnType<typeof createAdminClient>

type CheckoutItem = { productId: string; name: string; quantity: number; price: number }

type Customer = {
  firstName: string
  lastName: string
  email: string
  phone: string
}

type ShippingAddress = {
  street: string
  numExterior?: string
  numInterior?: string
  referencias?: string
  colonia?: string
  municipio?: string
  city?: string
  state: string
  zip: string
  country?: string
}

export async function fulfillPaidOrder(
  supabase: Supabase,
  params: {
    sendEmail?: boolean
    orderId: string
    profileId: string | null
    items: CheckoutItem[]
    customer: Customer
    shippingAddress: ShippingAddress
    subtotal: number
    shippingCost: number
    total: number
    validCouponCode: string | null
    productIds: string[]
  }
): Promise<void> {
  const {
    orderId,
    profileId,
    items,
    customer,
    shippingAddress,
    subtotal,
    shippingCost,
    total,
    validCouponCode,
    productIds,
    sendEmail = true,
  } = params

  if (validCouponCode) {
    await supabase.rpc('increment_coupon_usage', { p_code: validCouponCode })
  }

  const { data: stockProducts } = await supabase
    .from('products')
    .select('id')
    .in('id', productIds)
    .eq('manage_stock', true)

  const trackedIds = new Set((stockProducts ?? []).map((p: { id: string }) => p.id))
  await Promise.allSettled(
    items
      .filter((i) => trackedIds.has(i.productId))
      .map((i) =>
        supabase.rpc('decrement_stock', {
          p_product_id: i.productId,
          p_quantity: i.quantity,
        })
      )
  )

  if (profileId) {
    const name = `${customer.firstName} ${customer.lastName}`.trim()
    try {
      const profileUpdates: Record<string, string> = {}
      if (name) profileUpdates.full_name = name
      if (customer.phone) profileUpdates.phone = customer.phone
      if (Object.keys(profileUpdates).length > 0) {
        await supabase.from('profiles').update(profileUpdates).eq('id', profileId)
      }
    } catch {
      /* silencioso */
    }

    try {
      const { data: existingAddr } = await supabase
        .from('addresses')
        .select('id')
        .eq('profile_id', profileId)
        .eq('street', shippingAddress.street ?? '')
        .eq('zip_code', shippingAddress.zip ?? '')
        .maybeSingle()

      if (!existingAddr) {
        await supabase.from('addresses').insert({
          profile_id:   profileId,
          street:       shippingAddress.street ?? '',
          num_exterior: shippingAddress.numExterior ?? null,
          num_interior: shippingAddress.numInterior ?? null,
          colonia:      shippingAddress.colonia ?? null,
          municipio:    shippingAddress.municipio ?? null,
          referencias:  shippingAddress.referencias ?? null,
          city:         shippingAddress.city ?? '',
          state:        shippingAddress.state ?? '',
          zip_code:     shippingAddress.zip ?? '',
          country:      shippingAddress.country ?? 'México',
        })
      }
    } catch {
      /* silencioso */
    }
  }

  if (!sendEmail) return

  try {
    await sendOrderConfirmation({
      to: customer.email,
      orderId,
      items,
      subtotal,
      shipping:        shippingCost,
      total,
      name:            `${customer.firstName} ${customer.lastName}`,
      shippingAddress: {
        street:      shippingAddress.street,
        numExterior: shippingAddress.numExterior,
        numInterior: shippingAddress.numInterior,
        colonia:     shippingAddress.colonia,
        municipio:   shippingAddress.municipio,
        referencias: shippingAddress.referencias,
        city:        shippingAddress.city,
        state:       shippingAddress.state,
        zip:         shippingAddress.zip,
        country:     shippingAddress.country ?? 'México',
      },
    })
  } catch (emailErr) {
    console.warn('[checkout] Email no enviado:', emailErr)
  }
}
