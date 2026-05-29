import type { Metadata } from 'next'
import ContactoForm from './ContactoForm'

export const metadata: Metadata = {
  title: 'Contacto | Empire Nutrition',
  description: 'Contáctanos para cualquier consulta, pedido especial o información sobre nuestros suplementos.',
}

export default function ContactoPage() {
  return (
    <div className="bg-black min-h-screen">
      <ContactoForm />
    </div>
  )
}
