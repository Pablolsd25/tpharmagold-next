import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Order } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Orden confirmada' }

interface Props { params: Promise<{ id: string }> }

export default async function OrdenPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, items:order_items(*, product:products(name, images))')
    .eq('id', id)
    .single()

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-white font-bold text-2xl mb-4">Orden no encontrada</h1>
        <Link href="/" className="text-zinc-400 hover:text-white transition-colors">Volver al inicio</Link>
      </div>
    )
  }

  const o = order as Order & { items: Array<{ product: { name: string; images: string[] }; quantity: number; unit_price: number }> }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
      {/* Check */}
      <div className="w-20 h-20 bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-white font-black text-3xl mb-2">¡Gracias por tu compra!</h1>
      <p className="text-zinc-400 mb-1">Tu pedido ha sido confirmado y está siendo procesado.</p>
      <p className="text-zinc-500 text-sm mb-8">
        Número de orden: <span className="text-zinc-300 font-mono">{o.id.slice(0, 8).toUpperCase()}</span>
      </p>

      {/* Resumen */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 text-left mb-8">
        <h2 className="text-white font-semibold mb-4">Resumen del pedido</h2>
        <div className="space-y-3 mb-4">
          {o.items?.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-zinc-400">{item.product?.name} × {item.quantity}</span>
              <span className="text-zinc-300">${(item.unit_price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-zinc-800 pt-3 space-y-1 text-sm">
          <div className="flex justify-between text-zinc-400">
            <span>Subtotal</span><span>${o.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Envío</span><span>${o.shipping_cost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-white font-bold text-base pt-2">
            <span>Total pagado</span><span>${o.total.toFixed(2)} MXN</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/tienda"
          className="bg-white text-black font-semibold px-8 py-3 rounded-lg hover:bg-zinc-200 transition-colors"
        >
          Seguir comprando
        </Link>
        <Link
          href="/cuenta/ordenes"
          className="border border-zinc-600 text-white font-semibold px-8 py-3 rounded-lg hover:border-zinc-400 transition-colors"
        >
          Ver mis órdenes
        </Link>
      </div>
    </div>
  )
}
