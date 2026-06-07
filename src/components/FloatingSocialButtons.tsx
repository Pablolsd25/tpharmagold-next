'use client'

import { useState } from 'react'
import { useCartStore } from '@/lib/store/cart'

// ── Actualiza estas URLs con tus redes sociales reales ────────────────────
const LINKS = {
  whatsapp:  'https://wa.me/525571527659?text=Hola%2C%20me%20interesa%20un%20producto%20de%20Empire%20Nutrition',
  instagram: 'https://instagram.com/TUUSUARIO',  // ← cambia esto
  facebook:  'https://facebook.com/TUPAGINA',    // ← cambia esto
  tiktok:    'https://tiktok.com/@TUUSUARIO',    // ← cambia esto
}
// ─────────────────────────────────────────────────────────────────────────

const socials = [
  {
    id:        'whatsapp',
    label:     '¿Hablamos?',
    href:      LINKS.whatsapp,
    color:     '#25D366',
    glow:      'rgba(37,211,102,0.45)',
    pulse:     true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  {
    id:        'instagram',
    label:     'Instagram',
    href:      LINKS.instagram,
    color:     '#E1306C',
    glow:      'rgba(225,48,108,0.45)',
    pulse:     false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id:        'facebook',
    label:     'Facebook',
    href:      LINKS.facebook,
    color:     '#1877F2',
    glow:      'rgba(24,119,242,0.45)',
    pulse:     false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id:        'tiktok',
    label:     'TikTok',
    href:      LINKS.tiktok,
    color:     '#23F30E',
    glow:      'rgba(35,243,14,0.35)',
    pulse:     false,
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.67a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
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
          {/* Label tooltip — slides in from right */}
          <span
            className={`
              absolute right-14 whitespace-nowrap
              bg-zinc-950 border border-zinc-800 text-white
              text-[11px] font-display uppercase tracking-widest
              px-3 py-1.5 rounded-lg
              transition-all duration-200 pointer-events-none select-none
              ${hovered === s.id
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-2'}
            `}
            style={hovered === s.id ? { borderColor: s.color + '60' } : undefined}
          >
            {s.label}
          </span>

          {/* Button */}
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            className="relative w-11 h-11 rounded-full bg-zinc-950 border border-zinc-800
              flex items-center justify-center
              transition-all duration-300"
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
            {/* Pulse ring — solo WhatsApp */}
            {s.pulse && (
              <span
                className="absolute inset-0 rounded-full animate-ping opacity-20"
                style={{ background: s.color }}
              />
            )}
            {s.icon}
          </a>
        </div>
      ))}
    </div>
  )
}
