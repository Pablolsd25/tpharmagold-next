/** Tarjetas de prueba OpenPay México — solo sandbox. @see https://documents.openpay.mx/docs/testing.html */

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
}

export const OPENPAY_SANDBOX_TEST_CARDS: OpenPayTestCard[] = [
  {
    id: 'visa-ok',
    label: 'Visa — pago aprobado',
    brand: 'Visa',
    number: '4111111111111111',
    holder: 'Juan Perez Ramirez',
    expMonth: '12',
    expYear: '28',
    cvv: '123',
  },
  {
    id: 'mc-ok',
    label: 'Mastercard — pago aprobado',
    brand: 'Mastercard',
    number: '5105105105105100',
    holder: 'Juan Perez Ramirez',
    expMonth: '12',
    expYear: '28',
    cvv: '123',
  },
  {
    id: 'amex-ok',
    label: 'American Express — pago aprobado',
    brand: 'Amex',
    number: '345678000000007',
    holder: 'Juan Perez Ramirez',
    expMonth: '12',
    expYear: '28',
    cvv: '1234',
    note: 'CVV de 4 dígitos',
  },
  {
    id: 'visa-alt',
    label: 'Visa alternativa',
    brand: 'Visa',
    number: '4242424242424242',
    holder: 'Maria Lopez',
    expMonth: '12',
    expYear: '28',
    cvv: '123',
  },
]

export function isOpenPaySandboxClient(): boolean {
  return process.env.NEXT_PUBLIC_OPENPAY_SANDBOX === 'true'
}
