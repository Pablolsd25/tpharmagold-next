import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Contacto' }

export default function ContactoPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-white font-black text-3xl mb-4">Contacto</h1>
      <p className="text-zinc-400 mb-10">¿Tienes dudas? Escríbenos y te respondemos en menos de 24 horas.</p>

      <form className="space-y-5">
        {[
          { name: 'name',    label: 'Nombre completo', type: 'text' },
          { name: 'email',   label: 'Correo electrónico', type: 'email' },
          { name: 'subject', label: 'Asunto', type: 'text' },
        ].map((f) => (
          <div key={f.name}>
            <label className="block text-zinc-400 text-sm mb-1">{f.label}</label>
            <input
              type={f.type}
              name={f.name}
              required
              className="w-full bg-zinc-900 text-white rounded-xl px-4 py-3 border border-zinc-700
                focus:outline-none focus:border-zinc-500 text-sm"
            />
          </div>
        ))}
        <div>
          <label className="block text-zinc-400 text-sm mb-1">Mensaje</label>
          <textarea
            name="message"
            rows={5}
            required
            className="w-full bg-zinc-900 text-white rounded-xl px-4 py-3 border border-zinc-700
              focus:outline-none focus:border-zinc-500 text-sm resize-none"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition-colors"
        >
          Enviar mensaje
        </button>
      </form>
    </div>
  )
}
