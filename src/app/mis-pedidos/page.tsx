import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import RecentOrderRedirect from '@/components/orders/RecentOrderRedirect'
import { findOrderByEmailAndReference } from '@/lib/order-lookup'

export const metadata: Metadata = { title: 'Buscar mi pedido — Empire Nutrition' }

interface SearchParams { email?: string; order?: string }

export default async function MisPedidosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (user) redirect('/cuenta/ordenes')

  const sp    = await searchParams
  const email = sp.email?.trim().toLowerCase()
  const order = sp.order?.trim()

  let searched = false
  let notFound = false
  let emailMismatch = false

  if (email && order) {
    searched = true
    const supabase = createAdminClient()
    const orderRow = await findOrderByEmailAndReference(supabase, email, order)

    if (orderRow) {
      redirect(`/orden/${orderRow.id}`)
    }

    const prefix = order.replace(/^#/, '').trim().toLowerCase()
    if (prefix.length >= 8) {
      const { data: recent } = await supabase
        .from('orders')
        .select('id, customer_email')
        .order('created_at', { ascending: false })
        .limit(80)

      const byPrefix = (recent ?? []).filter((r) =>
        r.id.toLowerCase().replace(/-/g, '').startsWith(prefix.replace(/-/g, ''))
      )
      if (byPrefix.length === 1 && byPrefix[0].customer_email) {
        const stored = byPrefix[0].customer_email.trim().toLowerCase()
        if (stored !== email) {
          emailMismatch = true
        }
      }
    }

    notFound = true
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <Suspense fallback={null}>
        <RecentOrderRedirect />
      </Suspense>
      <div className="text-center mb-10">
        <h1 className="text-white font-black text-3xl mb-3">Buscar mi pedido</h1>
        <p className="text-zinc-400 text-sm">
          Si acabas de comprar, te llevamos automáticamente a tu pedido. Si no, ingresa correo y número
          de orden.
        </p>
      </div>

      {/* ── Formulario de búsqueda ─────────────────────────────────────────── */}
      <form method="GET" action="/mis-pedidos" className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8 space-y-4">
        <div>
          <label className="block text-zinc-400 text-sm mb-2">Correo electrónico</label>
          <input
            type="email"
            name="email"
            defaultValue={email}
            placeholder="tu@correo.com"
            required
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-2.5 border border-zinc-700
              focus:outline-none focus:border-zinc-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-zinc-400 text-sm mb-2">
            Número de orden{' '}
            <span className="text-zinc-600 font-normal">(lo recibiste en tu correo de confirmación)</span>
          </label>
          <input
            type="text"
            name="order"
            defaultValue={order}
            placeholder="Ej: 12400 o #4C58A9E8"
            required
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-2.5 border border-zinc-700
              focus:outline-none focus:border-zinc-500 text-sm font-mono"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2.5 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors text-sm"
        >
          Buscar pedido
        </button>
      </form>

      {searched && notFound && (
        <div className="text-center py-10">
          <p className="text-zinc-500 mb-4">No encontramos un pedido con esos datos.</p>
          {emailMismatch && (
            <p className="text-amber-400/90 text-sm mb-4 max-w-md mx-auto">
              El número de orden existe, pero el correo no coincide con el del checkout. Usa el mismo
              correo que escribiste al pagar.
            </p>
          )}
          <p className="text-zinc-600 text-sm mb-2">
            Usa el mismo correo que pusiste en el checkout y el número que viste al confirmar la compra
            (ej. <span className="font-mono text-zinc-500">#D8A0C33C</span>, sin espacios extra).
          </p>
          <p className="text-zinc-600 text-xs mb-6">
            Si compraste hace un momento en este navegador, cierra esta búsqueda y entra otra vez a Mi
            pedido sin llenar el formulario.
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
      )}

      {!searched && (
        <p className="text-zinc-600 text-sm text-center">
          Ingresa tu correo y número de orden para consultar el estado de tu pedido.
        </p>
      )}
    </div>
  )
}
