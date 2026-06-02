import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Webhooks OpenPay — Admin' }

// ─────────────────────────────────────────────────────────────────────────────
// Badges de color por tipo de evento
// ─────────────────────────────────────────────────────────────────────────────
function EventBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    'charge.succeeded':           'bg-green-900 text-green-300 border-green-800',
    'charge.failed':              'bg-red-900 text-red-300 border-red-800',
    'charge.cancelled':           'bg-zinc-700 text-zinc-300 border-zinc-600',
    'charge.refunded':            'bg-blue-900 text-blue-300 border-blue-800',
    'chargeback.created':           'bg-yellow-900 text-yellow-300 border-yellow-800',
    'chargeback.accepted':          'bg-orange-900 text-orange-300 border-orange-800',
    'chargeback.rejected':          'bg-green-900 text-green-300 border-green-800',
    verification:                   'bg-blue-900 text-blue-300 border-blue-800',
    'unknown':                    'bg-zinc-800 text-zinc-500 border-zinc-700',
  }
  const cls = colors[type] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono border ${cls}`}>
      {type}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    received:  'bg-zinc-700 text-zinc-300',
    processed: 'bg-green-900 text-green-400',
    ignored:   'bg-zinc-800 text-zinc-500',
    error:     'bg-red-900 text-red-400',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? 'bg-zinc-700 text-zinc-400'}`}>
      {status}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────────────────────
interface SearchParams { page?: string; type?: string; status?: string }

export default async function WebhooksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  // Auth check
  const auth = await createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) redirect('/login')

  const sp     = await searchParams
  const page   = Math.max(1, parseInt(sp.page  ?? '1', 10))
  const filter = sp.type   ?? 'all'
  const stFilter = sp.status ?? 'all'
  const PER_PAGE = 50

  const supabase = createAdminClient()

  // ── Verificar que la tabla existe ────────────────────────────────────────
  // Si la migración no se ha ejecutado, mostrar un aviso en lugar de error
  let tableExists = true
  {
    const { error } = await supabase
      .from('webhook_events')
      .select('id', { count: 'exact', head: true })
      .limit(1)
    if (error?.code === '42P01') tableExists = false  // 42P01 = tabla no existe
  }

  if (!tableExists) {
    return (
      <div className="p-6 max-w-3xl">
        <h1 className="text-white font-bold text-2xl mb-6">Webhooks OpenPay</h1>
        <div className="bg-yellow-950 border border-yellow-800 rounded-xl p-6">
          <p className="text-yellow-300 font-semibold mb-2">Migración pendiente</p>
          <p className="text-yellow-200/70 text-sm mb-4">
            La tabla <code className="font-mono bg-yellow-900/50 px-1 rounded">webhook_events</code> no existe aún.
            Ejecuta la migración en el Supabase Dashboard para activar el registro de webhooks.
          </p>
          <p className="text-yellow-200/60 text-xs font-mono">
            Archivo: <span className="text-yellow-300">supabase/migrations/20260529_webhook_events.sql</span>
          </p>
          <p className="text-yellow-200/60 text-xs mt-1">
            Supabase Dashboard → SQL Editor → pegar el contenido del archivo → Run
          </p>
        </div>
      </div>
    )
  }

  // ── Query con filtros ─────────────────────────────────────────────────────
  let query = supabase
    .from('webhook_events')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * PER_PAGE, page * PER_PAGE - 1)

  if (filter !== 'all')   query = query.eq('event_type', filter)
  if (stFilter !== 'all') query = query.eq('status', stFilter)

  const { data: events, count } = await query
  const filteredTotal = count ?? 0
  const pages = Math.max(1, Math.ceil(filteredTotal / PER_PAGE))

  const { count: globalCount } = await supabase
    .from('webhook_events')
    .select('id', { count: 'exact', head: true })

  const total = globalCount ?? 0
  const filterActive = filter !== 'all' || stFilter !== 'all'
  const webhookUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://casaempire-next.vercel.app')
  const webhookEndpoint = `${webhookUrl}/api/webhooks/openpay`

  // ── Contadores por tipo (para filtro rápido) ──────────────────────────────
  const { data: typeCounts } = await supabase
    .from('webhook_events')
    .select('event_type')
    .order('event_type')

  const byType = (typeCounts ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.event_type] = (acc[r.event_type] ?? 0) + 1
    return acc
  }, {})

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-white font-bold text-2xl">Webhooks OpenPay</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Registro de todos los eventos recibidos — {total} eventos en total
          </p>
        </div>
        {/* Indicador modo sandbox */}
        {process.env.NEXT_PUBLIC_OPENPAY_SANDBOX === 'true' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-900/50 border border-yellow-800 text-yellow-400 text-xs font-semibold rounded-lg">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            Sandbox activo
          </span>
        )}
      </div>

      {/* Filtros rápidos por tipo de evento */}
      <div className="flex flex-wrap gap-2">
        {['all', ...Object.keys(byType)].map((t) => {
          const active = filter === t
          return (
            <a
              key={t}
              href={`/admin/webhooks?type=${t}&status=${stFilter}`}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                active
                  ? 'bg-accent text-black border-accent'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500'
              }`}
            >
              {t === 'all' ? `Todos (${total})` : `${t} (${byType[t]})`}
            </a>
          )
        })}
      </div>

      {/* Filtros de estado */}
      <div className="flex gap-2">
        {['all', 'received', 'processed', 'ignored', 'error'].map((s) => {
          const active = stFilter === s
          return (
            <a
              key={s}
              href={`/admin/webhooks?type=${filter}&status=${s}`}
              className={`px-3 py-1 rounded-lg text-xs border transition-colors ${
                active
                  ? 'bg-zinc-100 text-black border-zinc-300'
                  : 'bg-zinc-900 text-zinc-500 border-zinc-700 hover:text-zinc-300'
              }`}
            >
              {s === 'all' ? 'Estado: todos' : s}
            </a>
          )
        })}
      </div>

      {filterActive && total > 0 && filteredTotal === 0 && (
        <div className="bg-amber-950/40 border border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-200/90">
          Hay {total} eventos en total, pero ninguno con este filtro.{' '}
          <a href="/admin/webhooks" className="text-accent underline hover:no-underline">
            Ver todos
          </a>
        </div>
      )}

      {/* Tabla de eventos */}
      {!events?.length ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 sm:p-12 space-y-6">
          <div className="text-center">
            <p className="text-zinc-400 text-sm font-medium">No hay eventos registrados aún.</p>
            <p className="text-zinc-600 text-xs mt-2 max-w-lg mx-auto">
              Esta pantalla es un <strong className="text-zinc-500">registro de notificaciones</strong> que
              OpenPay envía a tu servidor. Las compras en checkout pueden funcionar sin webhooks; aquí solo
              verás eventos si OpenPay está configurado para llamar a tu URL.
            </p>
          </div>
          <ul className="text-zinc-500 text-xs space-y-3 max-w-xl mx-auto list-disc list-inside">
            <li>
              <strong className="text-zinc-400">1. URL en OpenPay:</strong> en el dashboard sandbox →
              Configuración → Webhooks, agrega la URL de abajo (no <code className="font-mono">localhost</code>).
            </li>
            <li>
              <strong className="text-zinc-400">2. Eventos suscritos:</strong> charge.succeeded, charge.failed,
              charge.cancelled, charge.refunded, etc.
            </li>
            <li>
              <strong className="text-zinc-400">3. Prueba:</strong> usa el botón de prueba en OpenPay o haz un
              cargo en sandbox; OpenPay debe poder alcanzar tu URL pública (Vercel o ngrok).
            </li>
            <li>
              <strong className="text-zinc-400">4. Migración SQL:</strong> si en logs ves error de tabla, ejecuta{' '}
              <code className="font-mono text-zinc-400">supabase/migrations/20260529_webhook_events.sql</code> en
              Supabase.
            </li>
          </ul>
          {stFilter !== 'all' && (
            <p className="text-center text-amber-400/80 text-xs">
              Tienes el filtro de estado «{stFilter}» activo.{' '}
              <a href="/admin/webhooks" className="underline">
                Quitar filtros
              </a>
            </p>
          )}
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Fecha</th>
                  <th className="text-left px-4 py-3">Evento</th>
                  <th className="text-left px-4 py-3">Transaction ID</th>
                  <th className="text-left px-4 py-3">Orden</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="text-left px-4 py-3">Nota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-zinc-800/50 transition-colors">
                    {/* Fecha */}
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap text-xs font-mono">
                      {new Date(ev.created_at).toLocaleString('es-MX', {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </td>

                    {/* Tipo de evento */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <EventBadge type={ev.event_type} />
                    </td>

                    {/* Transaction ID */}
                    <td className="px-4 py-3 text-zinc-400 font-mono text-xs whitespace-nowrap">
                      {ev.transaction_id ? (
                        <span title={ev.transaction_id}>
                          {ev.transaction_id.slice(0, 12)}…
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>

                    {/* Orden */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {ev.order_id ? (
                        <a
                          href={`/admin/ordenes/${ev.order_id}`}
                          className="text-accent hover:underline font-mono text-xs"
                        >
                          {String(ev.order_id).slice(0, 8).toUpperCase()}
                        </a>
                      ) : (
                        <span className="text-zinc-600 text-xs">—</span>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={ev.status} />
                    </td>

                    {/* Nota / error */}
                    <td className="px-4 py-3 text-zinc-500 text-xs max-w-xs truncate">
                      {ev.error_message ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginación */}
      {pages > 1 && filteredTotal > 0 && (
        <div className="flex items-center justify-between text-sm text-zinc-500">
          <span>Página {page} de {pages} ({filteredTotal} con filtro)</span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`/admin/webhooks?page=${page - 1}&type=${filter}&status=${stFilter}`}
                className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                ← Anterior
              </a>
            )}
            {page < pages && (
              <a
                href={`/admin/webhooks?page=${page + 1}&type=${filter}&status=${stFilter}`}
                className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                Siguiente →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Guía de configuración de webhook en OpenPay */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-white font-semibold text-sm mb-3">
          Configurar webhook en OpenPay Sandbox
        </h3>
        <ol className="text-zinc-400 text-xs space-y-1.5 list-decimal list-inside">
          <li>Accede a tu <strong className="text-zinc-300">OpenPay Sandbox Dashboard</strong></li>
          <li>Ve a <strong className="text-zinc-300">Configuración → Webhooks</strong></li>
          <li>
            Agrega la URL:{' '}
            <code className="font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-accent break-all">
              {webhookEndpoint}
            </code>
          </li>
          <li>
            Suscríbete a los eventos (nombres oficiales OpenPay):{' '}
            <code className="font-mono text-zinc-300 text-[11px] leading-relaxed block mt-1">
              verification · charge.succeeded · charge.failed · charge.cancelled · charge.refunded ·
              chargeback.created · chargeback.accepted · chargeback.rejected
            </code>
          </li>
          <li>
            Si configuraste usuario/contraseña en OpenPay, define{' '}
            <code className="font-mono text-zinc-400">OPENPAY_WEBHOOK_USER</code> y{' '}
            <code className="font-mono text-zinc-400">OPENPAY_WEBHOOK_PASSWORD</code> en Vercel
          </li>
          <li>
            Al guardar, OpenPay envía <code className="font-mono">verification</code> — debe aparecer
            aquí con el código; cópialo en el dashboard para activar el webhook
          </li>
        </ol>
        <p className="text-zinc-600 text-xs mt-3">
          En desarrollo local usa <strong className="text-zinc-400">ngrok</strong> para exponer
          el servidor: <code className="font-mono">ngrok http 3000</code> y usa la URL de ngrok
          como webhook temporalmente.
        </p>
      </div>
    </div>
  )
}
