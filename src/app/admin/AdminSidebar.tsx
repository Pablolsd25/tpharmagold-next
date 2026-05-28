'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/admin',              label: 'Dashboard',    icon: '▦' },
  { href: '/admin/productos',    label: 'Productos',    icon: '📦' },
  { href: '/admin/ordenes',      label: 'Órdenes',      icon: '🛒' },
  { href: '/admin/categorias',   label: 'Categorías',   icon: '🏷' },
  { href: '/admin/blog',         label: 'Blog',         icon: '📝' },
  { href: '/admin/configuracion',label: 'Configuración',icon: '⚙️' },
]

export default function AdminSidebar({ userEmail }: { userEmail: string }) {
  const path = usePathname()

  const isActive = (href: string) =>
    href === '/admin' ? path === '/admin' : path.startsWith(href)

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col min-h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 border-b border-zinc-800">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-accent font-display font-bold text-lg tracking-wide uppercase">Empire</span>
          <span className="text-zinc-400 text-xs mt-1">Admin</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors
              ${isActive(item.href)
                ? 'bg-accent text-black'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800">
        <p className="text-zinc-500 text-xs truncate mb-3">{userEmail}</p>
        <Link
          href="/"
          className="block text-center text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded py-1.5 transition-colors"
        >
          ← Ver tienda
        </Link>
      </div>
    </aside>
  )
}
