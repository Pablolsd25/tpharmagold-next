/** Datos legales del comercio — visibles en footer, contacto, términos y checkout */

export const LEGAL = {
  legalName: 'T Pharma Gold',
  tradeName: 'T Pharma Gold',
  tradeNameAlt: 'T-PHARMA GOLD',
  tagline: 'El mejor complemento para atletas',
  phone: '+52 55 2792 6652',
  phoneE164: '525527926652',
  whatsappUrl: 'https://wa.me/525527926652',
  email: 'contacto@tpharmagold.com',
  website: 'tpharmagold.com',
  fiscalAddress: {
    line1: 'Calle 32 #143 col Estado de México',
    line2: 'Nezahualcoyotl, 57210',
  },
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
