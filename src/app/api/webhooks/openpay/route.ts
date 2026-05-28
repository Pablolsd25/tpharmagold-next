import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, data } = body

    if (type === 'charge.succeeded') {
      const supabase = await createClient()
      const transactionId = data?.object?.id

      if (transactionId) {
        await supabase
          .from('orders')
          .update({ status: 'paid' })
          .eq('openpay_transaction_id', transactionId)
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }
}
