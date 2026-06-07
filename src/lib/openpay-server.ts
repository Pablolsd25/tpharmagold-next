/**
 * Cliente HTTP para API OpenPay (equivalente a openpay-node sin dependencia npm).
 * @see https://documents.openpay.mx/docs/libraries
 * @see https://github.com/open-pay/openpay-node
 */

import { isOpenPaySandbox } from '@/lib/openpay-env'

export function getOpenPayApi(): string {
  return isOpenPaySandbox()
    ? 'https://sandbox-api.openpay.mx/v1'
    : 'https://api.openpay.mx/v1'
}

export const OPENPAY_MERCHANT_ID = process.env.NEXT_PUBLIC_OPENPAY_MERCHANT_ID!
const OPENPAY_PRIVATE_KEY = process.env.OPENPAY_PRIVATE_KEY!

/** Recomendado en openpay-node: openpay.setTimeout(30000) */
export const OPENPAY_REQUEST_TIMEOUT_MS = 30_000

export function openpayAuthHeader(): string {
  return 'Basic ' + Buffer.from(`${OPENPAY_PRIVATE_KEY}:`).toString('base64')
}

export async function openpayFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const url = path.startsWith('http') ? path : `${getOpenPayApi()}/${OPENPAY_MERCHANT_ID}${path}`
  return fetch(url, {
    ...init,
    headers: {
      Authorization: openpayAuthHeader(),
      'Content-Type': 'application/json',
      ...init.headers,
    },
    signal: init.signal ?? AbortSignal.timeout(OPENPAY_REQUEST_TIMEOUT_MS),
  })
}
