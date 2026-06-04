import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Preguntas frecuentes' }

const faqs = [
  {
    q: '¿Cuánto tiempo tarda mi pedido en llegar?',
    a: 'Los envíos dentro de la Ciudad de México llegan en 1-2 días hábiles. Para el resto de la República Mexicana, el tiempo de entrega es de 3-5 días hábiles.',
  },
  {
    q: '¿Cómo puedo rastrear mi pedido?',
    a: 'Una vez enviado tu pedido, recibirás un correo con el número de guía para rastrear tu paquete en la paquetería correspondiente.',
  },
  {
    q: '¿Qué métodos de pago aceptan?',
    a: 'Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express) a través de Openpay con cifrado SSL.',
  },
  {
    q: '¿Los productos son originales?',
    a: 'Sí, todos nuestros productos son 100% originales y provienen directamente de distribuidores autorizados.',
  },
  {
    q: '¿Puedo devolver un producto?',
    a: 'Sí, aceptamos devoluciones dentro de los primeros 7 días naturales después de recibir tu pedido, siempre que el producto esté sin abrir y en su empaque original.',
  },
  {
    q: '¿Cómo creo una cuenta?',
    a: 'Puedes crear una cuenta haciendo clic en el ícono de usuario en la parte superior de la página. Con tu cuenta podrás ver el historial de pedidos y guardar tus direcciones.',
  },
]

export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-white font-black text-3xl mb-4">Preguntas frecuentes</h1>
      <p className="text-zinc-400 mb-10">Respuestas a las dudas más comunes de nuestros clientes.</p>

      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <details
            key={i}
            className="group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
          >
            <summary className="flex items-center justify-between px-6 py-4 cursor-pointer text-white font-medium hover:bg-zinc-800 transition-colors list-none">
              {faq.q}
              <svg
                className="w-5 h-5 text-zinc-500 group-open:rotate-180 transition-transform flex-shrink-0 ml-3"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-6 pb-5 text-zinc-400 text-sm leading-relaxed border-t border-zinc-800 pt-4">
              {faq.a}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
