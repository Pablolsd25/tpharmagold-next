/**
 * Ambiente OpenPay (sandbox vs producción).
 * En Vercel conviene definir OPENPAY_SANDBOX y NEXT_PUBLIC_OPENPAY_SANDBOX con el mismo valor.
 */
export function isOpenPaySandbox(): boolean {
  if (process.env.OPENPAY_SANDBOX === 'true') return true
  if (process.env.OPENPAY_SANDBOX === 'false') return false
  return process.env.NEXT_PUBLIC_OPENPAY_SANDBOX === 'true'
}
