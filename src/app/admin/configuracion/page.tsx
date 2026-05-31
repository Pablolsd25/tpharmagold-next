'use client'

import { useState, useEffect } from 'react'

const DEFAULT_VIDEO_480  = 'https://video.wixstatic.com/video/d60565_a92a4ba089fb4a6d8e4893b90cef9183/480p/mp4/file.mp4'
const DEFAULT_VIDEO_1080 = 'https://video.wixstatic.com/video/d60565_a92a4ba089fb4a6d8e4893b90cef9183/1080p/mp4/file.mp4'

export default function ConfiguracionPage() {
  const [video480,      setVideo480]      = useState(DEFAULT_VIDEO_480)
  const [video1080,     setVideo1080]     = useState(DEFAULT_VIDEO_1080)
  const [shippingCost,  setShippingCost]  = useState<string>('250')
  const [savedShipping, setSavedShipping] = useState(false)
  const [savingShipping, setSavingShipping] = useState(false)
  const [shippingError, setShippingError]  = useState('')
  const [loadingCost,   setLoadingCost]   = useState(true)

  // Cargar el costo de envío actual desde la BD
  useEffect(() => {
    fetch('/api/shipping-cost')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.cost != null) setShippingCost(String(d.cost)) })
      .catch(() => {})
      .finally(() => setLoadingCost(false))
  }, [])

  // Guardar costo de envío
  const handleSaveShipping = async (e: React.FormEvent) => {
    e.preventDefault()
    setShippingError('')
    const cost = parseFloat(shippingCost)
    if (isNaN(cost) || cost < 0) {
      setShippingError('Ingresa un monto válido (número positivo).')
      return
    }
    setSavingShipping(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ key: 'shipping_cost', value: cost.toFixed(2) }),
      })
      if (!res.ok) {
        const d = await res.json()
        setShippingError(d.error ?? 'Error al guardar.')
      } else {
        setSavedShipping(true)
        setTimeout(() => setSavedShipping(false), 3000)
      }
    } catch {
      setShippingError('Error de conexión.')
    } finally {
      setSavingShipping(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-white font-display font-bold text-3xl uppercase tracking-wide">Configuración</h1>
        <p className="text-zinc-500 text-sm mt-1">Ajustes generales del sitio</p>
      </div>

      {/* ── Costo de envío ───────────────────────────────────────────── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
        <div>
          <h2 className="text-white font-semibold text-lg mb-1">Costo de envío</h2>
          <p className="text-zinc-500 text-sm">
            Tarifa plana a todo México (MXN). El cambio se aplica inmediatamente a todos los pedidos nuevos.
          </p>
        </div>
        <form onSubmit={handleSaveShipping} className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-zinc-400 text-xs uppercase tracking-wide mb-1">
              Monto (MXN)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={loadingCost ? '' : shippingCost}
                onChange={e => setShippingCost(e.target.value)}
                disabled={loadingCost}
                placeholder={loadingCost ? 'Cargando...' : '250.00'}
                className="bg-zinc-950 border border-zinc-700 text-white rounded-lg pl-7 pr-4 py-2 text-sm
                  focus:outline-none focus:border-accent w-36 disabled:opacity-50"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pb-0.5">
            <button
              type="submit"
              disabled={savingShipping || loadingCost}
              className="btn-accent px-5 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {savingShipping ? 'Guardando...' : 'Guardar'}
            </button>
            {savedShipping && <span className="text-green-400 text-sm">Guardado ✓</span>}
            {shippingError && <span className="text-red-400 text-sm">{shippingError}</span>}
          </div>
        </form>
        <p className="text-zinc-600 text-xs">
          Nota: si un cupón de "envío gratis" está aplicado, el costo se omite automáticamente.
        </p>
      </div>

      {/* ── Video Hero ───────────────────────────────────────────────── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-5">
        <div>
          <h2 className="text-white font-semibold text-lg mb-1">Video de portada</h2>
          <p className="text-zinc-500 text-sm">
            El video intro que se muestra al inicio de la página principal.
          </p>
        </div>

        <div className="rounded overflow-hidden border border-zinc-800 aspect-video bg-black relative">
          <video key={video480} className="w-full h-full object-cover" autoPlay muted loop playsInline>
            <source src={video1080} type="video/mp4" />
            <source src={video480}  type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          <span className="absolute bottom-2 left-2 text-xs text-zinc-400 bg-black/60 px-2 py-0.5 rounded">
            Vista previa
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-zinc-400 text-xs uppercase tracking-wide mb-1">
              URL video 480p (móvil)
            </label>
            <input
              value={video480}
              onChange={e => setVideo480(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 text-zinc-300 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-zinc-400 text-xs uppercase tracking-wide mb-1">
              URL video 1080p (escritorio)
            </label>
            <input
              value={video1080}
              onChange={e => setVideo1080(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 text-zinc-300 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-accent"
            />
          </div>
          <p className="text-zinc-600 text-xs">
            Los cambios de video son solo visuales en esta vista previa. Para persistirlos, contáctanos para conectar este campo a la BD.
          </p>
        </div>
      </div>

      {/* ── Info del sitio ───────────────────────────────────────────── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
        <h2 className="text-white font-semibold text-lg">Información del sitio</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: 'Nombre',   value: 'Empire Nutrition' },
            { label: 'Dominio',  value: 'casaempire.net' },
            { label: 'País',     value: 'México (MXN)' },
            { label: 'Gateway',  value: 'OpenPay' },
          ].map((item) => (
            <div key={item.label} className="bg-zinc-950 rounded p-3">
              <p className="text-zinc-600 text-xs uppercase tracking-wide">{item.label}</p>
              <p className="text-white mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Accesos Supabase ─────────────────────────────────────────── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-white font-semibold text-lg mb-3">Base de datos</h2>
        <p className="text-zinc-500 text-sm mb-4">Gestiona la base de datos directamente en Supabase.</p>
        <a
          href="https://supabase.com/dashboard/project/frrdwgcycoeueavqhhqz"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block btn-accent px-5 py-2 rounded text-sm"
        >
          Abrir Supabase Dashboard →
        </a>
      </div>
    </div>
  )
}
