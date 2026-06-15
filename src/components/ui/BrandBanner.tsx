import { LEGAL } from '@/lib/site-legal'

/** Banner de marca al pie de categorías — oro T Pharma (nunca verde) */
export default function BrandBanner() {
  return (
    <div className="relative w-full overflow-hidden bg-black py-20 sm:py-28 flex items-center justify-center border-t border-zinc-900">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(201,162,39,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(201,162,39,0.08) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[600px] h-[300px] rounded-full"
          style={{
            background:
              'radial-gradient(ellipse, rgba(201,162,39,0.12) 0%, transparent 70%)',
          }}
        />
      </div>
      <div className="relative z-10 text-center px-4">
        <h2
          className="font-display font-bold uppercase tracking-widest text-gold-metal"
          style={{ fontSize: 'clamp(2.5rem, 7vw, 5.5rem)' }}
        >
          {LEGAL.tradeNameAlt}
        </h2>
        <p
          className="mt-3 font-display uppercase tracking-[0.3em] text-zinc-300"
          style={{ fontSize: 'clamp(1rem, 3vw, 1.6rem)' }}
        >
          {LEGAL.tagline}
        </p>
      </div>
    </div>
  )
}
