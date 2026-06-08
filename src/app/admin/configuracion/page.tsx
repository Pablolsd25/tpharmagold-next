'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DEFAULT_HOME_VIDEO_480,
  DEFAULT_HOME_VIDEO_1080,
  DEFAULT_HOME_SHOWCASE_VIDEO,
} from '@/lib/home-video'
import { uploadHomeVideoFile, type HomeVideoUploadProgress } from '@/lib/utils/home-video-upload'
import HomeVideoUpload from '@/components/admin/HomeVideoUpload'

async function saveSetting(key: string, value: string) {
  const res = await fetch('/api/admin/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  })
  if (!res.ok) {
    const d = await res.json()
    throw new Error(d.error ?? 'Error al guardar.')
  }
}

export default function ConfiguracionPage() {
  const [video480, setVideo480] = useState(DEFAULT_HOME_VIDEO_480)
  const [video1080, setVideo1080] = useState(DEFAULT_HOME_VIDEO_1080)
  const [showcaseVideo, setShowcaseVideo] = useState(DEFAULT_HOME_SHOWCASE_VIDEO)

  const [shippingCost, setShippingCost] = useState<string>('250')
  const [savedShipping, setSavedShipping] = useState(false)
  const [savingShipping, setSavingShipping] = useState(false)
  const [shippingError, setShippingError] = useState('')
  const [loadingCost, setLoadingCost] = useState(true)
  const [loadingVideo, setLoadingVideo] = useState(true)

  const [salesEmail1, setSalesEmail1] = useState('')
  const [salesEmail2, setSalesEmail2] = useState('')
  const [loadingSalesEmails, setLoadingSalesEmails] = useState(true)
  const [savingSalesEmails, setSavingSalesEmails] = useState(false)
  const [savedSalesEmails, setSavedSalesEmails] = useState(false)
  const [salesEmailsError, setSalesEmailsError] = useState('')
  const [testingEmail, setTestingEmail] = useState(false)
  const [testEmailResult, setTestEmailResult] = useState('')
  const [testEmailError, setTestEmailError] = useState('')

  const [uploadingHero, setUploadingHero] = useState(false)
  const [uploadingShowcase, setUploadingShowcase] = useState(false)
  const [savedHero, setSavedHero] = useState(false)
  const [savedShowcase, setSavedShowcase] = useState(false)
  const [heroError, setHeroError] = useState('')
  const [showcaseError, setShowcaseError] = useState('')
  const [heroStatus, setHeroStatus] = useState('')
  const [showcaseStatus, setShowcaseStatus] = useState('')

  const formatUploadStatus = (p: HomeVideoUploadProgress) => {
    if (p.phase === 'compressing') {
      return p.percent != null ? `Comprimiendo video… ${p.percent}%` : 'Comprimiendo video…'
    }
    if (p.phase === 'uploading') return 'Subiendo video…'
    return 'Preparando…'
  }

  useEffect(() => {
    fetch('/api/shipping-cost')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.cost != null) setShippingCost(String(d.cost))
      })
      .catch(() => {})
      .finally(() => setLoadingCost(false))

    fetch('/api/home-video')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.video480) setVideo480(d.video480)
        if (d?.video1080) setVideo1080(d.video1080)
        if (d?.showcaseVideo) setShowcaseVideo(d.showcaseVideo)
      })
      .catch(() => {})
      .finally(() => setLoadingVideo(false))

    fetch('/api/admin/settings?key=sales_notification_emails')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.emails?.length) {
          setSalesEmail1(d.emails[0] ?? '')
          setSalesEmail2(d.emails[1] ?? '')
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSalesEmails(false))
  }, [])

  const handleTestEmail = async () => {
    const target = salesEmail1.trim() || salesEmail2.trim()
    if (!target) {
      setTestEmailError('Guarda al menos un correo en Correo 1 para probar.')
      return
    }
    setTestEmailError('')
    setTestEmailResult('')
    setTestingEmail(true)
    try {
      const res = await fetch('/api/admin/test-email', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: target }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al enviar')
      setTestEmailResult(data.hint ?? 'Correo de prueba enviado.')
    } catch (err: unknown) {
      setTestEmailError(err instanceof Error ? err.message : 'Error de conexión.')
    } finally {
      setTestingEmail(false)
    }
  }

  const handleSaveSalesEmails = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalesEmailsError('')
    const combined = [salesEmail1, salesEmail2].filter((v) => v.trim()).join(',')
    if (salesEmail1.trim() && !salesEmail1.includes('@')) {
      setSalesEmailsError('Correo 1 no válido.')
      return
    }
    if (salesEmail2.trim() && !salesEmail2.includes('@')) {
      setSalesEmailsError('Correo 2 no válido.')
      return
    }
    setSavingSalesEmails(true)
    try {
      await saveSetting('sales_notification_emails', combined)
      setSavedSalesEmails(true)
      setTimeout(() => setSavedSalesEmails(false), 3000)
    } catch (err: unknown) {
      setSalesEmailsError(err instanceof Error ? err.message : 'Error de conexión.')
    } finally {
      setSavingSalesEmails(false)
    }
  }

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
      await saveSetting('shipping_cost', cost.toFixed(2))
      setSavedShipping(true)
      setTimeout(() => setSavedShipping(false), 3000)
    } catch (err: unknown) {
      setShippingError(err instanceof Error ? err.message : 'Error de conexión.')
    } finally {
      setSavingShipping(false)
    }
  }

  const handleHeroUpload = useCallback(async (file: File) => {
    setHeroError('')
    setHeroStatus('')
    setUploadingHero(true)
    try {
      const url = await uploadHomeVideoFile(file, (p) => setHeroStatus(formatUploadStatus(p)))
      await Promise.all([
        saveSetting('home_video_480', url),
        saveSetting('home_video_1080', url),
      ])
      setVideo480(url)
      setVideo1080(url)
      setSavedHero(true)
      setTimeout(() => setSavedHero(false), 3000)
    } catch (err: unknown) {
      setHeroError(err instanceof Error ? err.message : 'Error al subir.')
    } finally {
      setUploadingHero(false)
      setHeroStatus('')
    }
  }, [])

  const handleShowcaseUpload = useCallback(async (file: File) => {
    setShowcaseError('')
    setShowcaseStatus('')
    setUploadingShowcase(true)
    try {
      const url = await uploadHomeVideoFile(file, (p) => setShowcaseStatus(formatUploadStatus(p)))
      await saveSetting('home_showcase_video', url)
      setShowcaseVideo(url)
      setSavedShowcase(true)
      setTimeout(() => setSavedShowcase(false), 3000)
    } catch (err: unknown) {
      setShowcaseError(err instanceof Error ? err.message : 'Error al subir.')
    } finally {
      setUploadingShowcase(false)
      setShowcaseStatus('')
    }
  }, [])

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-white font-display font-bold text-3xl uppercase tracking-wide">
          Configuración
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Ajustes generales del sitio</p>
      </div>

      {/* ── Notificaciones de ventas ─────────────────────────────────── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
        <div>
          <h2 className="text-white font-semibold text-lg mb-1">Notificaciones de ventas</h2>
          <p className="text-zinc-500 text-sm">
            Hasta 2 correos reciben aviso cuando un cliente paga. El segundo es opcional.
          </p>
        </div>
        <form onSubmit={handleSaveSalesEmails} className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] max-w-sm">
              <label className="block text-zinc-400 text-xs uppercase tracking-wide mb-1">
                Correo 1
              </label>
              <input
                type="email"
                value={loadingSalesEmails ? '' : salesEmail1}
                onChange={(e) => setSalesEmail1(e.target.value)}
                disabled={loadingSalesEmails}
                placeholder={loadingSalesEmails ? 'Cargando...' : 'contacto@casaempire.net'}
                className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:border-accent disabled:opacity-50"
              />
            </div>
            <div className="flex-1 min-w-[200px] max-w-sm">
              <label className="block text-zinc-400 text-xs uppercase tracking-wide mb-1">
                Correo 2 <span className="text-zinc-600 normal-case">(opcional)</span>
              </label>
              <input
                type="email"
                value={loadingSalesEmails ? '' : salesEmail2}
                onChange={(e) => setSalesEmail2(e.target.value)}
                disabled={loadingSalesEmails}
                placeholder="segundo@correo.com"
                className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:border-accent disabled:opacity-50"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="submit"
              disabled={savingSalesEmails || loadingSalesEmails}
              className="btn-accent px-5 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {savingSalesEmails ? 'Guardando...' : 'Guardar'}
            </button>
            {savedSalesEmails && <span className="text-green-400 text-sm">Guardado ✓</span>}
            {salesEmailsError && <span className="text-red-400 text-sm">{salesEmailsError}</span>}
          </div>
          <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleTestEmail}
              disabled={testingEmail || loadingSalesEmails}
              className="border border-zinc-600 text-zinc-300 px-4 py-2 rounded-lg text-sm hover:border-accent hover:text-white disabled:opacity-50"
            >
              {testingEmail ? 'Enviando prueba...' : 'Enviar correo de prueba'}
            </button>
            <span className="text-zinc-600 text-xs">Usa Correo 1 · revisa spam si no llega</span>
          </div>
          {testEmailResult && (
            <p className="text-green-400 text-sm">{testEmailResult}</p>
          )}
          {testEmailError && (
            <p className="text-red-400 text-sm">{testEmailError}</p>
          )}
        </form>
        <p className="text-zinc-600 text-xs leading-relaxed">
          Los envíos automáticos salen desde{' '}
          <strong className="text-zinc-400">contacto@casaempire.net</strong>{' '}
          vía Google Workspace (SMTP). En Vercel define{' '}
          <strong className="text-zinc-400">EMAIL_PROVIDER=smtp</strong>,{' '}
          <strong className="text-zinc-400">SMTP_USER</strong> y una{' '}
          <strong className="text-zinc-400">contraseña de aplicación</strong> en{' '}
          <strong className="text-zinc-400">SMTP_PASS</strong> (no la contraseña normal del buzón).
        </p>
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
                onChange={(e) => setShippingCost(e.target.value)}
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
          Nota: si un cupón de &quot;envío gratis&quot; está aplicado, el costo se omite automáticamente.
        </p>
      </div>

      <HomeVideoUpload
        title="Video de portada (hero)"
        description="Banner intro superior al inicio de la página principal."
        videoSrc={video1080}
        videoSrcMobile={video480}
        loading={loadingVideo}
        uploading={uploadingHero}
        statusMessage={heroStatus}
        saved={savedHero}
        error={heroError}
        onUpload={handleHeroUpload}
      />

      <HomeVideoUpload
        title="Video promocional (Máximo Potencial)"
        description='Sección "Alcanza tu Máximo Potencial", justo antes de Explora por categoría.'
        videoSrc={showcaseVideo}
        loading={loadingVideo}
        uploading={uploadingShowcase}
        statusMessage={showcaseStatus}
        saved={savedShowcase}
        error={showcaseError}
        onUpload={handleShowcaseUpload}
      />

      {/* ── Info del sitio ───────────────────────────────────────────── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
        <h2 className="text-white font-semibold text-lg">Información del sitio</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: 'Nombre', value: 'Empire Nutrition' },
            { label: 'Dominio', value: 'casaempire.net' },
            { label: 'País', value: 'México (MXN)' },
            { label: 'Gateway', value: 'Openpay' },
          ].map((item) => (
            <div key={item.label} className="bg-zinc-950 rounded p-3">
              <p className="text-zinc-600 text-xs uppercase tracking-wide">{item.label}</p>
              <p className="text-white mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

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
