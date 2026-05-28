import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Garantía y Devoluciones' }

export default function GarantiaPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-white font-black text-3xl mb-4">Garantía y Devoluciones</h1>
      <p className="text-zinc-400 mb-10">Tu satisfacción es nuestra prioridad.</p>

      <div className="prose prose-invert prose-zinc max-w-none text-zinc-300">
        <h2 className="text-white font-bold text-xl mt-8 mb-3">Política de devoluciones</h2>
        <p>Aceptamos devoluciones dentro de los primeros <strong>7 días naturales</strong> después de recibir tu pedido, siempre que se cumplan las siguientes condiciones:</p>
        <ul className="space-y-1 text-zinc-400 text-sm mt-3">
          <li>El producto debe estar sin abrir y en su empaque original.</li>
          <li>Debes presentar el comprobante de compra.</li>
          <li>El producto no debe presentar daños por mal uso.</li>
        </ul>

        <h2 className="text-white font-bold text-xl mt-8 mb-3">Productos con garantía</h2>
        <p>Todos nuestros productos cuentan con garantía de autenticidad. Si recibes un producto que no es el que pediste o está dañado, te lo reponemos sin costo.</p>

        <h2 className="text-white font-bold text-xl mt-8 mb-3">¿Cómo solicitar una devolución?</h2>
        <ol className="space-y-2 text-zinc-400 text-sm mt-3">
          <li>1. Contáctanos a través de la página de <a href="/contacto" className="text-white hover:text-zinc-300">Contacto</a>.</li>
          <li>2. Indica tu número de orden y el motivo de la devolución.</li>
          <li>3. Te enviamos las instrucciones para enviar el producto de regreso.</li>
          <li>4. Una vez recibido y validado, procesamos tu reembolso en 3-5 días hábiles.</li>
        </ol>

        <h2 className="text-white font-bold text-xl mt-8 mb-3">Productos no elegibles</h2>
        <p>No se aceptan devoluciones de productos que han sido abiertos, usados o que por higiene no puedan ser revendidos.</p>
      </div>
    </div>
  )
}
