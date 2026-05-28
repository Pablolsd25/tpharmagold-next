import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Testimonios Pink Kit para Mujeres' }

const testimonios = [
  { name: 'Ana García', comment: 'Increíble producto, noté cambios desde la primera semana. 100% recomendado.', stars: 5 },
  { name: 'María López', comment: 'El Pink Kit es exactamente lo que necesitaba. Llegó rápido y bien empacado.', stars: 5 },
  { name: 'Sofía Martínez', comment: 'Me encanta la calidad y el sabor. Ya hice mi segundo pedido.', stars: 5 },
  { name: 'Fernanda Torres', comment: 'Excelente servicio al cliente. Resolveroon mis dudas de inmediato.', stars: 5 },
]

export default function TestimoniosPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-white font-black text-3xl mb-4">Testimonios Pink Kit para Mujeres</h1>
      <p className="text-zinc-400 mb-10">Lo que dicen nuestras clientas sobre el Pink Kit.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {testimonios.map((t, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: t.stars }).map((_, s) => (
                <span key={s} className="text-yellow-400 text-lg">★</span>
              ))}
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed mb-4">&ldquo;{t.comment}&rdquo;</p>
            <p className="text-zinc-500 text-sm font-medium">— {t.name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
