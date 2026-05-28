import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-black border-t border-zinc-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Marca */}
          <div className="col-span-1 md:col-span-2">
            <span className="text-white font-bold text-xl tracking-widest uppercase">Casa Empire</span>
            <p className="mt-3 text-zinc-400 text-sm leading-relaxed max-w-xs">
              Nutrición y suplementos de alta calidad para alcanzar tu máximo potencial.
            </p>
          </div>

          {/* Tienda */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Tienda</h3>
            <ul className="space-y-2">
              {[
                { href: '/tienda',            label: 'Todos los productos' },
                { href: '/categoria/hombres', label: "Men's Nutrition" },
                { href: '/categoria/mujeres', label: "Women's Nutrition" },
                { href: '/ofertas',           label: 'Ofertas' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-zinc-400 hover:text-white text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Ayuda</h3>
            <ul className="space-y-2">
              {[
                { href: '/faq',       label: 'Preguntas frecuentes' },
                { href: '/envios',    label: 'Envíos seguros' },
                { href: '/garantia',  label: 'Garantía y devoluciones' },
                { href: '/contacto',  label: 'Contacto' },
                { href: '/privacidad',label: 'Política de privacidad' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-zinc-400 hover:text-white text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-zinc-500 text-xs">
            © {new Date().getFullYear()} Casa Empire. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 text-xs">Pagos seguros con</span>
            <span className="text-zinc-300 text-xs font-semibold">OpenPay</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
