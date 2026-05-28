import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mi cuenta' }

export default async function CuentaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: recentOrders } = await supabase
    .from('orders')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-white font-black text-3xl mb-8">Mi cuenta</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {[
          { href: '/cuenta/ordenes',     icon: '📦', title: 'Mis órdenes',    desc: 'Historial de pedidos' },
          { href: '/cuenta/direcciones', icon: '📍', title: 'Mis direcciones', desc: 'Gestiona tus envíos' },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-6
              flex items-center gap-4 transition-all"
          >
            <span className="text-3xl">{card.icon}</span>
            <div>
              <h3 className="text-white font-semibold">{card.title}</h3>
              <p className="text-zinc-400 text-sm">{card.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Info del perfil */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
        <h2 className="text-white font-semibold mb-4">Información personal</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-zinc-500">Nombre</span>
            <p className="text-white">{profile?.full_name ?? '—'}</p>
          </div>
          <div>
            <span className="text-zinc-500">Email</span>
            <p className="text-white">{profile?.email}</p>
          </div>
          <div>
            <span className="text-zinc-500">Teléfono</span>
            <p className="text-white">{profile?.phone ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Órdenes recientes */}
      {recentOrders && recentOrders.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-white font-semibold">Órdenes recientes</h2>
            <Link href="/cuenta/ordenes" className="text-zinc-400 hover:text-white text-sm transition-colors">
              Ver todas →
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between text-sm">
                <span className="text-zinc-400 font-mono">{order.id.slice(0, 8).toUpperCase()}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  order.status === 'paid'      ? 'bg-green-900 text-green-400' :
                  order.status === 'shipped'   ? 'bg-blue-900 text-blue-400' :
                  order.status === 'delivered' ? 'bg-emerald-900 text-emerald-400' :
                  'bg-zinc-800 text-zinc-400'
                }`}>
                  {order.status}
                </span>
                <span className="text-white font-medium">${order.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cerrar sesión */}
      <form action="/api/auth/signout" method="post" className="mt-8">
        <button
          type="submit"
          className="text-zinc-500 hover:text-red-400 text-sm transition-colors"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  )
}
