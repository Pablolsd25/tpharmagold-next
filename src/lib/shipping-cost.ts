import { createAdminClient } from '@/lib/supabase/admin'
import { SHIPPING_COST } from '@/lib/constants'

/** Costo de envío vigente (site_settings o constante por defecto). */
export async function getPublicShippingCost(): Promise<number> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'shipping_cost')
      .maybeSingle()
    if (data?.value) {
      const parsed = parseFloat(data.value)
      if (!Number.isNaN(parsed)) return parsed
    }
  } catch {
    /* fallback */
  }
  return SHIPPING_COST
}
