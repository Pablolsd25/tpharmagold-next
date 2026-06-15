/** Tarjetas de prueba OpenPay México — solo sandbox. @see https://www.openpay.mx/docs/testing.html */

export type OpenPayTestCard = {
  id: string
  label: string
  brand: string
  number: string
  holder: string
  expMonth: string
  expYear: string
  cvv: string
  note?: string
  /** success = cargo aprobado; decline = simula rechazo en sandbox */
  outcome: 'success' | 'decline'
  /** Código OpenPay esperado (solo tarjetas de rechazo) */
  expectedCode?: number
  /** Descripción oficial OpenPay (referencia en modo prueba) */
  expectedDescription?: string
}

const HOLDER = 'Juan Perez Ramirez'
const EXP = { expMonth: '12', expYear: '28' } as const

/** Cualquier fecha posterior al mes actual y CVV de 3 dígitos (4 en Amex). */
export const OPENPAY_SANDBOX_VALIDITY_NOTE =
  'Vigencia: cualquier fecha futura. CVV: 3 dígitos (4 en Amex).'

export const OPENPAY_SANDBOX_SUCCESS_CARDS: OpenPayTestCard[] = [
  {
    id: 'visa-ok',
    label: 'Visa — pago aprobado',
    brand: 'Visa',
    number: '4111111111111111',
    holder: HOLDER,
    ...EXP,
    cvv: '123',
    outcome: 'success',
  },
  {
    id: 'mc-ok',
    label: 'Mastercard — pago aprobado',
    brand: 'Mastercard',
    number: '5105105105105100',
    holder: HOLDER,
    ...EXP,
    cvv: '123',
    outcome: 'success',
  },
  {
    id: 'amex-ok',
    label: 'American Express — pago aprobado',
    brand: 'Amex',
    number: '345678000000007',
    holder: HOLDER,
    ...EXP,
    cvv: '1234',
    note: 'CVV de 4 dígitos',
    outcome: 'success',
  },
  {
    id: 'visa-alt',
    label: 'Visa alternativa — aprobada',
    brand: 'Visa',
    number: '4242424242424242',
    holder: 'Maria Lopez',
    ...EXP,
    cvv: '123',
    outcome: 'success',
  },
]

/** Números no válidos — simulan rechazos (homologación OpenPay). */
export const OPENPAY_SANDBOX_DECLINE_CARDS: OpenPayTestCard[] = [
  {
    id: 'decline-3001-visa',
    label: 'Rechazada (3001)',
    brand: 'Visa',
    number: '4222222222222220',
    holder: HOLDER,
    ...EXP,
    cvv: '123',
    outcome: 'decline',
    expectedCode: 3001,
    expectedDescription: 'La tarjeta fue rechazada.',
  },
  {
    id: 'decline-3002',
    label: 'Expirada (3002)',
    brand: 'Visa',
    number: '4000000000000069',
    holder: HOLDER,
    ...EXP,
    cvv: '123',
    outcome: 'decline',
    expectedCode: 3002,
    expectedDescription: 'La tarjeta ha expirado.',
  },
  {
    id: 'decline-3003',
    label: 'Sin fondos (3003)',
    brand: 'Visa',
    number: '4444444444444448',
    holder: HOLDER,
    ...EXP,
    cvv: '123',
    outcome: 'decline',
    expectedCode: 3003,
    expectedDescription: 'La tarjeta no tiene fondos suficientes.',
    note: 'En el sitio se muestra como “tarjeta declinada”',
  },
  {
    id: 'decline-3004',
    label: 'Robada (3004)',
    brand: 'Visa',
    number: '4000000000000119',
    holder: HOLDER,
    ...EXP,
    cvv: '123',
    outcome: 'decline',
    expectedCode: 3004,
    expectedDescription: 'La tarjeta ha sido identificada como robada.',
    note: 'En el sitio se muestra como “tarjeta declinada”',
  },
  {
    id: 'decline-3005-visa',
    label: 'Antifraude (3005)',
    brand: 'Visa',
    number: '4000000000000044',
    holder: HOLDER,
    ...EXP,
    cvv: '123',
    outcome: 'decline',
    expectedCode: 3005,
    expectedDescription: 'Rechazada por el sistema antifraude.',
    note: 'En el sitio se muestra como “tarjeta declinada”',
  },
  {
    id: 'decline-3005-mc',
    label: 'Antifraude Mastercard (3005)',
    brand: 'Mastercard',
    number: '5454545454545454',
    holder: HOLDER,
    ...EXP,
    cvv: '123',
    outcome: 'decline',
    expectedCode: 3005,
    expectedDescription: 'Rechazada por el sistema antifraude.',
    note: 'En el sitio se muestra como “tarjeta declinada”',
  },
  {
    id: 'decline-3001-amex',
    label: 'Rechazada Amex (3001)',
    brand: 'Amex',
    number: '3400000000000009',
    holder: HOLDER,
    ...EXP,
    cvv: '1234',
    outcome: 'decline',
    expectedCode: 3001,
    expectedDescription: 'La tarjeta fue rechazada.',
  },
  {
    id: 'decline-3002-amex',
    label: 'Expirada Amex (3002)',
    brand: 'Amex',
    number: '373737373737374',
    holder: HOLDER,
    ...EXP,
    cvv: '1234',
    outcome: 'decline',
    expectedCode: 3002,
    expectedDescription: 'La tarjeta ha expirado.',
  },
  {
    id: 'decline-3003-amex',
    label: 'Sin fondos Amex (3003)',
    brand: 'Amex',
    number: '370000000000002',
    holder: HOLDER,
    ...EXP,
    cvv: '1234',
    outcome: 'decline',
    expectedCode: 3003,
    expectedDescription: 'La tarjeta no tiene fondos suficientes.',
    note: 'En el sitio se muestra como “tarjeta declinada”',
  },
]

export const OPENPAY_SANDBOX_TEST_CARDS: OpenPayTestCard[] = [
  ...OPENPAY_SANDBOX_SUCCESS_CARDS,
  ...OPENPAY_SANDBOX_DECLINE_CARDS,
]

export function isOpenPaySandboxClient(): boolean {
  return process.env.NEXT_PUBLIC_OPENPAY_SANDBOX === 'true'
}
