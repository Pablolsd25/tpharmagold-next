import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Order } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mis órdenes' }

const statusLabel: Record<string, string> = {
  pending:   'Pendiente',
  paid:      'Pagado',
  shipped:   'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const statusColor: Record<string, string> = {
  pending:   'bg-yellow-900 text-yellow-400',
  paid:      'bg-green-900 text-green-400',
  shipped:   'bg-blue-900 text-blue-400',
  delivered: 'bg-emerald-900 text-emerald-400',
  cancelled: 'bg-red-900 text-red-400',
}

export default async function OrdenesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/cuenta" className="text-zinc-500 hover:text-white transition-colors text-sm">← Cuenta</Link>
        <h1 className="text-white font-black text-3xl">Mis órdenes</h1>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-zinc-500 text-lg mb-4">No tienes órdenes aún.</p>
          <Link href="/tienda" className="text-white underline text-sm">Ir a la tienda</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {(orders as Order[]).map((order) => (
            <Link
              key={order.id}
              href={`/orden/${order.id}`}
              className="block bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-colors group"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-zinc-400 text-xs mb-1">
                    {new Date(order.created_at).toLocaleDateString('es-MX', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                  <p className="text-white font-mono font-medium">#{order.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColor[order.status] ?? 'bg-zinc-800 text-zinc-400'}`}>
                  {statusLabel[order.status] ?? order.status}
                </span>
                <div className="flex items-center gap-3">
                  <p className="text-white font-bold text-lg">${order.total.toFixed(2)} MXN</p>
                  <span className="text-zinc-600 group-hover:text-zinc-300 transition-colors text-lg">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
