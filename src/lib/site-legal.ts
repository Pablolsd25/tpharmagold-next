/** Datos legales del comercio — visibles en footer, contacto, términos y checkout */

export const LEGAL = {
  legalName: 'Comercializadora Casa Empire Nutrition SA de CV',
  tradeName: 'Empire Nutrition',
  tradeNameAlt: 'Casa Empire',
  phone: '55 7152 7659',
  phoneE164: '525571527659',
  email: 'contacto@casaempire.net',
  website: 'casaempire.net',
  paymentProcessor:
    'Los pagos con tarjeta se procesan de forma segura a través de Openpay, operado por BBVA.',
} as const

export const LEGAL_LINKS = {
  terminos: '/terminos',
  privacidad: '/privacidad',
  garantia: '/garantia',
  envios: '/envios',
  contacto: '/contacto',
} as const
