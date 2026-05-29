import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ProductGrid from '@/components/products/ProductGrid'
import VideoHero from '@/components/home/VideoHero'
import VideoShowcase from '@/components/home/VideoShowcase'
import type { Product } from '@/types'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: featuredProducts } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(8)

  const products = (featuredProducts ?? []) as Product[]

  return (
    <div>
      {/* Hero — Video intro Empire Nutrition */}
      <VideoHero />

      {/* Categorías */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col items-center mb-10">
          <h2 className="text-white font-display font-bold text-3xl sm:text-4xl uppercase tracking-tight">
            Explora por categoría
          </h2>
          <div className="mt-3 h-[3px] w-12 bg-accent rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              href:    '/categoria/hombres',
              label:   "Men's Nutrition",
              sub:     'Proteínas, pre-workout, creatina y más',
              glow:    'rgba(99,102,241,0.15)',
              dot:     'bg-indigo-500',
              border:  'hover:border-indigo-500/40',
              shadow:  'hover:shadow-[0_0_40px_rgba(99,102,241,0.12)]',
              tag:     '7 productos',
            },
            {
              href:    '/categoria/mujeres',
              label:   "Women's Nutrition",
              sub:     'Pink Kit, Glow Protein, quemadores',
              glow:    'rgba(236,72,153,0.15)',
              dot:     'bg-pink-500',
              border:  'hover:border-pink-500/40',
              shadow:  'hover:shadow-[0_0_40px_rgba(236,72,153,0.12)]',
              tag:     '12 productos',
            },
            {
              href:    '/tienda',
              label:   'Ver Tienda',
              sub:     'Todos nuestros productos disponibles',
              glow:    'rgba(35,243,14,0.12)',
              dot:     'bg-accent',
              border:  'hover:border-accent/40',
              shadow:  'hover:shadow-[0_0_40px_rgba(35,243,14,0.10)]',
              tag:     '19 productos',
            },
          ].map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className={`group relative h-52 rounded-xl bg-zinc-950 border border-zinc-800
                ${cat.border} ${cat.shadow}
                transition-all duration-300 flex flex-col justify-end p-6 overflow-hidden`}
            >
              {/* Corner glow blob */}
              <div className={`absolute -top-4 -right-4 w-32 h-32 ${cat.dot} opacity-0 group-hover:opacity-10 blur-3xl rounded-full transition-opacity duration-500`} />

              {/* Top accent line */}
              <div className={`absolute top-0 left-0 right-0 h-[2px] ${cat.dot} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />

              {/* Dot indicator */}
              <div className={`absolute top-5 right-5 w-2 h-2 ${cat.dot} rounded-full opacity-60 group-hover:opacity-100 transition-opacity`} />

              {/* Tag */}
              <span className="absolute top-5 left-5 text-[10px] font-display uppercase tracking-widest text-zinc-600 group-hover:text-zinc-400 transition-colors">
                {cat.tag}
              </span>

              <h3 className="text-white font-display font-bold text-xl uppercase tracking-wide leading-tight group-hover:text-accent transition-colors duration-200">
                {cat.label}
              </h3>
              <p className="text-zinc-500 text-sm mt-1.5 leading-snug group-hover:text-zinc-300 transition-colors">{cat.sub}</p>

              <div className="mt-4 flex items-center gap-2">
                <span className="text-[11px] font-display uppercase tracking-widest text-zinc-600 group-hover:text-accent transition-colors">
                  Ver productos
                </span>
                <span className="text-zinc-700 group-hover:text-accent group-hover:translate-x-1 transition-all duration-200">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Productos destacados */}
      {products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-white font-display font-bold text-3xl uppercase tracking-tight">
                Productos destacados
              </h2>
              <div className="mt-2 h-[3px] w-10 bg-accent rounded-full" />
            </div>
            <Link
              href="/tienda"
              className="text-accent hover:text-white text-xs font-display uppercase tracking-widest transition-colors flex items-center gap-1 group"
            >
              Ver todos
              <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
            </Link>
          </div>
          <ProductGrid products={products} />
        </section>
      )}

      {/* Video showcase — WEB HD */}
      <VideoShowcase />

      {/* Ventajas */}
      <section className="border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                ),
                title: 'Envío seguro',
                desc:  'A todo México desde $99',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: 'Garantía de calidad',
                desc:  'Productos 100% originales',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
                title: 'Pago seguro',
                desc:  'Con OpenPay, tarjeta o efectivo',
              },
            ].map((v) => (
              <div key={v.title} className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-accent">
                  {v.icon}
                </div>
                <h3 className="text-white font-display font-semibold uppercase tracking-wide text-sm">{v.title}</h3>
                <p className="text-zinc-500 text-sm">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
