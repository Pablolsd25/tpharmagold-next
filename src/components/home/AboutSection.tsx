import { WIX_ABOUT_TEXT } from '@/lib/tpharma-home'

export default function AboutSection() {
  return (
    <section className="bg-black border-t border-wix-gold/10">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
        <h2
          className="font-display font-bold text-gold-metal uppercase tracking-tight"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', lineHeight: 1.15 }}
        >
          ¿Quiénes somos?
        </h2>

        <p
          className="mt-10 text-white leading-[1.8]"
          style={{ fontSize: 'clamp(0.95rem, 2vw, 1.1rem)' }}
        >
          {WIX_ABOUT_TEXT}
        </p>
      </div>
    </section>
  )
}
