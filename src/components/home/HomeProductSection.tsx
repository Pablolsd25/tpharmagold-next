import Link from 'next/link'
import HomeProductCarousel from '@/components/home/HomeProductCarousel'
import type { HomeSectionConfig } from '@/lib/tpharma-home'
import type { Product } from '@/types'

type Props = {
  section: HomeSectionConfig
  products: Product[]
}

function SectionCta({
  href,
  label,
  variant,
}: {
  href: string
  label: string
  variant: 'gold' | 'pink' | 'green'
}) {
  const classes = {
    gold: 'btn-accent',
    pink: 'btn-rose-gold',
    green: 'btn-accent',
  }[variant]

  return (
    <Link
      href={href}
      className={`inline-block px-10 sm:px-14 py-3 font-display font-bold uppercase tracking-widest text-sm ${classes} transition-all`}
    >
      {label}
    </Link>
  )
}

export default function HomeProductSection({ section, products }: Props) {
  if (products.length === 0) return null

  const ctaVariant =
    section.accent === 'pink' ? 'pink' : section.accent === 'gold' ? 'gold' : 'green'

  return (
    <section
      id={section.id === 'premium' ? 'productos-premium' : undefined}
      className="bg-black border-t border-zinc-900/60"
    >
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="text-center mb-8 sm:mb-10">
          <h2
            className={`font-display font-bold tracking-tight ${
              section.accent === 'pink' ? 'text-rose-gold-metal' : 'text-gold-metal'
            }`}
            style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', lineHeight: 1.15 }}
          >
            {section.title}
          </h2>
          <p
            className="mt-5 max-w-3xl mx-auto text-white leading-[1.8]"
            style={{ fontSize: 'clamp(0.95rem, 2vw, 1.25rem)' }}
          >
            {section.subtitle}
          </p>

          {section.showCta && section.ctaPosition === 'top' && section.ctaHref && section.ctaLabel && (
            <div className="mt-8">
              <SectionCta href={section.ctaHref} label={section.ctaLabel} variant={ctaVariant} />
            </div>
          )}
        </div>

        <HomeProductCarousel products={products} />

        {section.showCta && section.ctaPosition === 'bottom' && section.ctaHref && section.ctaLabel && (
          <div className="mt-12 text-center">
            <SectionCta href={section.ctaHref} label={section.ctaLabel} variant={ctaVariant} />
          </div>
        )}
      </div>
    </section>
  )
}
