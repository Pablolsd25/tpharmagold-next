import Image from 'next/image'
import { DEFAULT_HOME_VIDEO_POSTER } from '@/lib/home-video'

interface Props {
  /** Optional: if omitted, render only `children` inside the content wrapper */
  title?: string
  subtitle?: string
  /** URL de imagen de fondo */
  image?: string
  /** Glow color as rgba string */
  glowColor?: string
  /** Rendered below title+subtitle (or as full content if title is omitted) */
  children?: React.ReactNode
}

export default function PageHero({
  title,
  subtitle,
  image = DEFAULT_HOME_VIDEO_POSTER,
  glowColor = 'rgba(201,162,39,0.14)',
  children,
}: Props) {
  return (
    <div className="relative border-b border-wix-gold/10 overflow-hidden">

      {/* ── Background image ── */}
      <Image
        src={image}
        alt=""
        fill
        priority
        className="object-cover object-center opacity-[0.18]"
      />

      {/* ── Left-to-right dark gradient so text stays readable ── */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/40" />

      {/* ── Bottom fade ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

      {/* ── Dot grid pattern ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.045]"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      {/* ── Accent glow corner ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top right, ${glowColor}, transparent 55%)`,
        }}
      />

      {/* ── Large faded watermark ── */}
      <span
        className="absolute right-6 bottom-0 translate-y-1/4 font-display font-bold uppercase
          select-none pointer-events-none leading-none text-white/[0.04]"
        style={{ fontSize: 'clamp(5rem, 14vw, 12rem)', letterSpacing: '-0.03em' }}
        aria-hidden
      >
        GOLD
      </span>

      {/* ── Content ── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {title ? (
          <>
            <h1 className="text-white font-display font-bold text-4xl sm:text-5xl uppercase tracking-tight leading-none">
              {title}
            </h1>
            <div className="mt-3 h-[3px] w-10 gold-bar" />
            {subtitle && (
              <p className="text-zinc-400 mt-3 text-sm max-w-lg leading-relaxed">{subtitle}</p>
            )}
            {children}
          </>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
