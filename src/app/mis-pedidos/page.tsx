import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Buscar mi pedido — Empire Nutrition' }

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

interface SearchParams { email?: string }

export default async function MisPedidosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  // Si el usuario está logueado, redirigir a /cuenta/ordenes (ya tiene vista propia)
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (user) redirect('/cuenta/ordenes')

  const sp    = await searchParams
  const email = sp.email?.trim().toLowerCase()

  // Solo buscamos si hay email
  type OrderRow = {
    id: string; status: string; total: number; created_at: string; tracking_number: string | null
  }
  let orders: OrderRow[] = []
  let searched = false

  if (email) {
    searched = true
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('orders')
      .select('id, status, total, created_at, tracking_number')
      .ilike('customer_email', email)      // case-insensitive
      .order('created_at', { ascending: false })
      .limit(10)                            // máximo 10 órdenes por email

    orders = (data ?? []) as OrderRow[]
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        <h1 className="text-white font-black text-3xl mb-3">Buscar mi pedido</h1>
        <p className="text-zinc-400 text-sm">
          Ingresa el correo electrónico que usaste al comprar para ver el estado de tus pedidos.
        </p>
      </div>

      {/* ── Formulario de búsqueda ─────────────────────────────────────────── */}
      <form method="GET" action="/mis-pedidos" className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <label className="block text-zinc-400 text-sm mb-2">Correo electrónico</label>
        <div className="flex gap-3">
          <input
            type="email"
            name="email"
            defaultValue={email}
            placeholder="tu@correo.com"
            required
            className="flex-1 bg-zinc-800 text-white rounded-lg px-4 py-2.5 border border-zinc-700
              focus:outline-none focus:border-zinc-500 text-sm"
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors text-sm whitespace-nowrap"
          >
            Buscar
          </button>
        </div>
      </form>

      {/* ── Resultados ─────────────────────────────────────────────────────── */}
      {searched && (
        <>
          {orders.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-zinc-500 mb-4">No encontramos pedidos asociados a ese correo.</p>
              <p className="text-zinc-600 text-sm mb-6">
                Verifica que el correo sea el mismo que usaste al comprar.
              </p>
              <a
                href="https://wa.me/525571527659"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline text-sm"
              >
                ¿Necesitas ayuda? Escríbenos por WhatsApp →
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-zinc-500 text-sm mb-4">
                {orders.length} pedido{orders.length !== 1 ? 's' : ''} encontrado{orders.length !== 1 ? 's' : ''}
                {' '}para <span className="text-zinc-300">{email}</span>
              </p>
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orden/${order.id}`}
                  className="block bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-colors group"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-zinc-400 text-xs mb-1">
                        {new Date(order.created_at).toLocaleDateString('es-MX', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </p>
                      <p className="text-white font-mono font-medium">#{order.id.slice(0, 8).toUpperCase()}</p>
                      {order.tracking_number && (
                        <p className="text-blue-400 text-xs mt-1 font-mono">
                          Guía: {order.tracking_number}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColor[order.status] ?? 'bg-zinc-800 text-zinc-400'}`}>
                        {statusLabel[order.status] ?? order.status}
                      </span>
                      <p className="text-white font-bold">${order.total.toFixed(2)} MXN</p>
                      <span className="text-zinc-600 group-hover:text-zinc-300 transition-colors">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* Enlace a login */}
      <div className="text-center mt-10 pt-6 border-t border-zinc-800">
        <p className="text-zinc-600 text-sm">
          ¿Tienes cuenta?{' '}
          <Link href="/login" className="text-accent hover:underline">
            Inicia sesión para ver todas tus órdenes →
          </Link>
        </p>
      </div>
    </div>
  )
}
