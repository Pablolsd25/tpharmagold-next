import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SHIPPING_COST } from '@/lib/constants'

/** GET /api/shipping-cost — devuelve el costo de envío vigente (desde site_settings o fallback a constante) */
export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'shipping_cost')
      .single()

    const cost = data ? parseFloat(data.value) : SHIPPING_COST
    return NextResponse.json({ cost }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ cost: SHIPPING_COST })
  }
}
