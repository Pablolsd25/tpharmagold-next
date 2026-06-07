import type { SupabaseClient } from '@supabase/supabase-js'

export type OrderNumberSource = {
  id: string
  wix_order_number?: number | null
}

/** Número visible para cliente y admin — prioriza secuencial (#12409) sobre UUID corto */
export function formatOrderNumber(
  order: OrderNumberSource,
  opts?: { withHash?: boolean },
): string {
  const withHash = opts?.withHash !== false
  if (order.wix_order_number != null) {
    return withHash ? `#${order.wix_order_number}` : String(order.wix_order_number)
  }
  const short = order.id.slice(0, 8).toUpperCase()
  return withHash ? `#${short}` : short
}

/** Lee wix_order_number de la BD si no vino en la respuesta del insert */
export async function resolveWixOrderNumber(
  supabase: SupabaseClient,
  orderId: string,
  known?: number | null,
): Promise<number | null> {
  if (known != null) return known
  const { data } = await supabase
    .from('orders')
    .select('wix_order_number')
    .eq('id', orderId)
    .maybeSingle()
  return data?.wix_order_number ?? null
}

