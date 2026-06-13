'use client'

import { useState } from 'react'

function LabeledField({
  label,
  tag = 'input',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> & {
  label: string
  tag?: 'input' | 'textarea'
  rows?: number
}) {
  const base =
    'w-full bg-black border border-white/80 text-white text-sm px-3 py-3 ' +
    'focus:border-wix-gold focus:outline-none transition-colors'

  return (
    <div>
      <label className="block text-white text-sm mb-2">{label}</label>
      {tag === 'textarea' ? (
        <textarea {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} className={`${base} resize-none`} />
      ) : (
        <input {...(props as React.InputHTMLAttributes<HTMLInputElement>)} className={base} />
      )}
    </div>
  )
}

export default function HomeContactSection() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form))

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        setStatus('error')
        return
      }
      setStatus('sent')
      form.reset()
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="contacto" className="bg-black border-t border-zinc-900/60 pb-24">
      <div className="max-w-[700px] mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="text-center mb-12">
          <h2
            className="font-display font-bold text-gold-metal uppercase tracking-tight"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', lineHeight: 1.15 }}
          >
            Contáctanos
          </h2>
          <p className="mt-6 text-white text-sm sm:text-base leading-[1.8]">
            Por favor, llena los siguientes campos con tus preguntas sobre un producto o si requieres
            información específica sobre el estado de tu pedido. Asegúrate de tener a mano tu número de
            pedido y el nombre del titular.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <LabeledField name="nombre" label="Nombre" type="text" />
          <LabeledField name="apellido" label="Apellido" type="text" />
          <LabeledField name="whatsapp" label="Teléfono" type="tel" />
          <LabeledField name="email" label="Email" type="email" required />
          <LabeledField
            tag="textarea"
            name="mensaje"
            label="Platícanos qué producto te interesa o si tienes dudas con tu envío"
            rows={5}
            required
          />

          <div className="text-center pt-4">
            <button
              type="submit"
              disabled={status === 'sending'}
              className="btn-accent font-display font-bold uppercase tracking-widest px-14 py-3 text-sm disabled:opacity-50"
            >
              {status === 'sending' ? 'Enviando…' : 'Enviar'}
            </button>
          </div>

          {status === 'sent' && (
            <p className="text-center text-wix-gold text-sm">¡Mensaje enviado! Te contactaremos pronto.</p>
          )}
          {status === 'error' && (
            <p className="text-center text-red-400 text-sm">No se pudo enviar. Intenta de nuevo.</p>
          )}
        </form>
      </div>
    </section>
  )
}
