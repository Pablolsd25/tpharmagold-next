/** Parámetros del cargo OpenPay alineados con la documentación MX (3D Secure + antifraude). */

const FALLBACK_DEVICE_SESSION = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isFallbackDeviceSessionId(id: string): boolean {
  return FALLBACK_DEVICE_SESSION.test(id.trim())
}

export function buildOpenPayChargeBody(params: {
  token: string
  amount: number
  deviceSessionId: string
  orderId?: string
  redirectUrl: string
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
}): Record<string, unknown> {
  const phone = params.customer.phone.replace(/\D/g, '').slice(-10)

  const customer: Record<string, string> = {
    name:      params.customer.firstName.trim().slice(0, 100),
    last_name: params.customer.lastName.trim().slice(0, 100),
    email:     params.customer.email.trim().slice(0, 100),
  }
  if (phone.length === 10) {
    customer.phone_number = phone
  }

  const body: Record<string, unknown> = {
    source_id:         params.token,
    method:            'card',
    amount:            params.amount,
    currency:          'MXN',
    description:       'Compra T Pharma Gold',
    device_session_id: params.deviceSessionId,
    use_3d_secure:     true,
    redirect_url:      params.redirectUrl,
    customer,
  }

  if (params.orderId) {
    // Openpay: order_id alfanumérico (sin guiones UUID)
    body.order_id = params.orderId.replace(/-/g, '').slice(0, 100)
  }

  return body
}
