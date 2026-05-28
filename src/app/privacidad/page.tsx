import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Política de privacidad' }

export default function PrivacidadPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-white font-black text-3xl mb-4">Política de Privacidad</h1>
      <p className="text-zinc-500 text-sm mb-10">Última actualización: {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long' })}</p>

      <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">
        <section>
          <h2 className="text-white font-bold text-lg mb-3">1. Información que recopilamos</h2>
          <p>Recopilamos información personal como nombre, correo electrónico, dirección de envío y datos de contacto cuando realizas una compra o creas una cuenta en Casa Empire.</p>
        </section>

        <section>
          <h2 className="text-white font-bold text-lg mb-3">2. Uso de la información</h2>
          <p>Utilizamos tu información para procesar pedidos, enviar confirmaciones de compra, gestionar tu cuenta y mejorar nuestros servicios. No vendemos ni compartimos tu información con terceros sin tu consentimiento.</p>
        </section>

        <section>
          <h2 className="text-white font-bold text-lg mb-3">3. Seguridad de pagos</h2>
          <p>Todos los pagos son procesados de forma segura a través de OpenPay. No almacenamos datos de tarjetas de crédito o débito en nuestros servidores.</p>
        </section>

        <section>
          <h2 className="text-white font-bold text-lg mb-3">4. Cookies</h2>
          <p>Utilizamos cookies para mantener tu sesión activa y recordar los productos en tu carrito. Puedes desactivar las cookies en la configuración de tu navegador.</p>
        </section>

        <section>
          <h2 className="text-white font-bold text-lg mb-3">5. Tus derechos</h2>
          <p>Tienes derecho a acceder, corregir o eliminar tu información personal. Para ejercer estos derechos, contáctanos a través de nuestra <a href="/contacto" className="text-white hover:text-zinc-300 underline">página de contacto</a>.</p>
        </section>
      </div>
    </div>
  )
}
