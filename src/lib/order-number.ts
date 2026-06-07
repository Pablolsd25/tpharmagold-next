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
