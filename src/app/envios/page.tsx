import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Envíos seguros' }

export default function EnviosPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-white font-black text-3xl mb-4">Envíos seguros</h1>
      <p className="text-zinc-400 mb-10">Tu pedido llega protegido y a tiempo.</p>

      <div className="space-y-6">
        {[
          { icon: '📦', title: 'Empaque protegido', desc: 'Todos los pedidos se empacan con material de protección para garantizar que lleguen en perfectas condiciones.' },
          { icon: '🚚', title: 'Envío a todo México', desc: 'Realizamos envíos a toda la República Mexicana. El costo de envío es de $99 MXN para todos los pedidos.' },
          { icon: '⏱️', title: 'Tiempos de entrega', desc: 'CDMX: 1-2 días hábiles. Interior de la República: 3-5 días hábiles. Los tiempos pueden variar en temporadas altas.' },
          { icon: '📍', title: 'Rastreo en tiempo real', desc: 'Una vez enviado tu pedido, recibirás un correo con el número de guía para rastrear tu paquete.' },
          { icon: '🔒', title: 'Garantía de entrega', desc: 'Si tu pedido no llega en el tiempo estimado, contáctanos y lo investigamos de inmediato sin costo adicional.' },
        ].map((item) => (
          <div key={item.title} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex gap-4">
            <span className="text-3xl flex-shrink-0">{item.icon}</span>
            <div>
              <h3 className="text-white font-semibold mb-1">{item.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
