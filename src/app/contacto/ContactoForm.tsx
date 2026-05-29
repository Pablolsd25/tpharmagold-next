'use client'

import { useState } from 'react'

const PINK = '#E8177A'

const inputClass =
  'w-full bg-transparent text-white text-sm pb-2 border-b border-[#E8177A] ' +
  'focus:outline-none placeholder:text-[#E8177A] placeholder:text-sm caret-[#E8177A]'

export default function ContactoForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form))
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      setStatus('sent')
      form.reset()
    } catch {
      setStatus('error')
    }
  }

  return (
    <>
      {/* ── Hero: title + form ─────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-start">

          {/* Left — "TE CONTACTAMOS" box */}
          <div className="lg:col-span-2">
            <div
              className="inline-block p-8 mb-6"
              style={{ border: `2px solid ${PINK}` }}
            >
              <h1
                className="font-display font-bold text-4xl lg:text-5xl uppercase leading-tight"
                style={{ color: PINK }}
              >
                TE<br />CONTACTAMOS
              </h1>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
              Utilice el siguiente formulario para cualquier solicitud especial,
              consulta, pregunta o inquietud.
            </p>
          </div>

          {/* Right — form */}
          <div className="lg:col-span-3">
            {status === 'sent' ? (
              <div className="py-16 text-center">
                <p
                  className="text-3xl font-display font-bold uppercase tracking-wide"
                  style={{ color: PINK }}
                >
                  ¡Mensaje enviado!
                </p>
                <p className="text-zinc-400 mt-3 text-sm">
                  Te contactaremos a la brevedad.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-8 text-xs text-zinc-500 hover:text-white underline transition-colors"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Row 1 — Nombre + Apellido */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <input
                    type="text"
                    name="nombre"
                    placeholder="Nombre"
                    required
                    className={inputClass}
                  />
                  <input
                    type="text"
                    name="apellido"
                    placeholder="Apellido"
                    required
                    className={inputClass}
                  />
                </div>

                {/* Row 2 — Email + WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email *"
                    required
                    className={inputClass}
                  />
                  <input
                    type="text"
                    name="whatsapp"
                    placeholder="Whatsapp / Telegram"
                    className={inputClass}
                  />
                </div>

                {/* Mensaje */}
                <textarea
                  name="mensaje"
                  rows={5}
                  placeholder="Escribe tu mensaje..."
                  required
                  className={`${inputClass} resize-none`}
                />

                {/* Error */}
                {status === 'error' && (
                  <p className="text-red-400 text-xs">
                    Hubo un error. Por favor intenta de nuevo o escríbenos directamente.
                  </p>
                )}

                {/* ENVIAR button */}
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="px-16 py-3 rounded-full font-display font-bold uppercase tracking-widest text-sm
                    transition-all hover:bg-[#E8177A] hover:text-black disabled:opacity-50"
                  style={{ border: `2px solid ${PINK}`, color: PINK, background: 'transparent' }}
                >
                  {status === 'sending' ? 'ENVIANDO...' : 'ENVIAR'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── Bottom: "Los Mejores suplementos" ───────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-20 border-t border-zinc-900 pt-12">
        <h2 className="text-accent font-display font-bold text-4xl lg:text-5xl leading-tight mb-4">
          Los Mejores suplementos<br className="hidden sm:block" /> al alcance
        </h2>
        <p className="text-zinc-400 text-sm leading-relaxed max-w-lg">
          Para consultas sobre marcas y productos al por mayor, envíanos un correo
          electrónico a{' '}
          <a
            href="mailto:cempirenutrition@outlook.com"
            className="underline transition-colors hover:text-white"
            style={{ color: PINK }}
          >
            cempirenutrition@outlook.com
          </a>
        </p>
      </section>
    </>
  )
}
