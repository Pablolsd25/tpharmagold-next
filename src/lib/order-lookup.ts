/** Normaliza entrada de número de orden (#D8A0C33C, UUID completo, etc.) */

export function normalizeOrderLookupInput(raw: string): string {
  return raw.trim().replace(/^#/, '').toLowerCase()
}

export function orderIdMatches(orderId: string, input: string): boolean {
  const needle = normalizeOrderLookupInput(input).replace(/-/g, '')
  const haystack = orderId.toLowerCase().replace(/-/g, '')
  if (!needle) return false
  if (needle.length >= 32) return haystack === needle
  return haystack.startsWith(needle)
}

export type OrderLookupRow = {
  id: string
  status: string
  total: number
  created_at: string
  tracking_number: string | null
  customer_email: string | null
}

import type { SupabaseClient } from '@supabase/supabase-js'

/** Busca pedido por correo + número (prefijo UUID, Wix o UUID completo) */
export async function findOrderByEmailAndReference(
  supabase: SupabaseClient,
  email: string,
  orderInput: string
): Promise<OrderLookupRow | null> {
  const normalizedEmail = email.trim().toLowerCase()
  const ref = orderInput.trim()

  const wixNum = parseInt(ref.replace(/^#/, ''), 10)
  if (!Number.isNaN(wixNum) && String(wixNum) === ref.replace(/^#/, '')) {
    const { data } = await supabase
      .from('orders')
      .select('id, status, total, created_at, tracking_number, customer_email')
      .eq('wix_order_number', wixNum)
      .ilike('customer_email', normalizedEmail)
      .maybeSingle()
    if (data) return data as OrderLookupRow
  }

  const prefix = normalizeOrderLookupInput(ref)

  const { data: rows, error } = await supabase
    .from('orders')
    .select('id, status, total, created_at, tracking_number, customer_email')
    .ilike('customer_email', normalizedEmail)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !rows?.length) return null

  const matches = rows.filter((row) => orderIdMatches(row.id, prefix))
  if (matches.length === 1) return matches[0] as OrderLookupRow

  return null
}
