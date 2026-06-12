'use client'

import { useState } from 'react'
import { useCartStore } from '@/lib/store/cart'
import { TPHARMA_SOCIAL } from '@/lib/tpharma-home'

const socials = [
  {
    id: 'whatsapp',
    label: '¿Hablamos?',
    href: TPHARMA_SOCIAL.whatsapp,
    color: '#25D366',
    glow: 'rgba(37,211,102,0.45)',
    pulse: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  {
    id: 'instagram',
    label: 'Instagram',
    href: TPHARMA_SOCIAL.instagram,
    color: '#E1306C',
    glow: 'rgba(225,48,108,0.45)',
    pulse: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
]

export default function FloatingSocialButtons() {
  const [hovered, setHovered] = useState<string | null>(null)
  const isCartOpen = useCartStore((s) => s.isOpen)

  if (isCartOpen) return null

  return (
    <div className="fixed bottom-6 right-5 z-30 flex flex-col items-end gap-2.5">
      {socials.map((s) => (
        <div
          key={s.id}
          className="relative flex items-center justify-end"
          onMouseEnter={() => setHovered(s.id)}
          onMouseLeave={() => setHovered(null)}
        >
          <span
            className={`
              absolute right-14 whitespace-nowrap
              bg-zinc-950 border border-zinc-800 text-white
              text-[11px] font-display uppercase tracking-widest
              px-3 py-1.5 rounded-lg
              transition-all duration-200 pointer-events-none select-none
              ${hovered === s.id ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}
            `}
            style={hovered === s.id ? { borderColor: s.color + '60' } : undefined}
          >
            {s.label}
          </span>

          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            className={`relative flex items-center justify-center transition-all duration-300 ${
              s.id === 'whatsapp'
                ? 'rounded-full bg-black border border-zinc-700 px-4 py-2.5 gap-2 text-white text-xs'
                : 'w-11 h-11 rounded-full bg-zinc-950 border border-zinc-800'
            }`}
            style={
              hovered === s.id
                ? {
                    borderColor: s.color + 'cc',
                    color: s.color,
                    boxShadow: `0 0 22px ${s.glow}`,
                    transform: 'scale(1.12)',
                  }
                : { color: '#71717a' }
            }
          >
            {s.pulse && process.env.NODE_ENV === 'production' && (
              <span
                className="absolute inset-0 rounded-full animate-ping opacity-20"
                style={{ background: s.color }}
              />
            )}
            {s.icon}
            {s.id === 'whatsapp' && <span>Contáctanos</span>}
          </a>
        </div>
      ))}
    </div>
  )
}
