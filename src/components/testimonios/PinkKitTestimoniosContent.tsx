import Image from 'next/image'
import Link from 'next/link'
import {
  PINK_KIT_ACCENT,
  PINK_KIT_FEATURED_IMAGES,
  PINK_KIT_GALLERY_IMAGES,
  PINK_KIT_HERO,
  PINK_KIT_PRODUCT,
  PINK_KIT_TRUST_BADGE,
} from '@/lib/pink-kit-testimonios'
import { wixMediaUrl } from '@/lib/wix-media'
import { PRODUCT_COVER_IMAGE_CLASS } from '@/lib/product-image-styles'

export default function PinkKitTestimoniosContent() {
  return (
    <div className="bg-black text-white">
      {/* ── Hero con video ── */}
      <section className="relative border-b border-zinc-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black z-10 pointer-events-none" />
        <video
          className="w-full max-h-[70vh] object-cover bg-black"
          autoPlay
          muted
          loop
          playsInline
          poster={PINK_KIT_HERO.poster}
        >
          <source src={PINK_KIT_HERO.video} type="video/mp4" />
        </video>
      </section>

      {/* ── Sección 1: intro + producto + destacados ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="text-center max-w-4xl mx-auto">
          <p className="text-zinc-500 text-xs sm:text-sm font-display uppercase tracking-[0.35em] mb-4">
            Testimonios de nuestras clientas
          </p>
          <h1
            className="font-display font-black uppercase leading-none"
            style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', color: PINK_KIT_ACCENT }}
          >
            Pink Kit
          </h1>
          <p
            className="mt-6 font-display font-bold uppercase tracking-wide text-white"
            style={{ fontSize: 'clamp(1.1rem, 3vw, 2rem)' }}
          >
            Glúteos + Piernas + Busto, bye bye abdomen
          </p>
          <p className="mt-6 text-zinc-300 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto">
            El producto que ha cambiado las piernas y glúteos de miles de mujeres, ahora en
            paquete. También aumenta tu busto.
          </p>
        </div>

        <Link
          href={`/producto/${PINK_KIT_PRODUCT.slug}`}
          className="group mt-12 block max-w-4xl mx-auto rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 hover:border-[#C9A089]/50 transition-colors"
        >
          <div className="grid md:grid-cols-[1.2fr_1fr]">
            <div className="relative aspect-[999/439] md:aspect-auto md:min-h-[220px] bg-black overflow-hidden">
              <Image
                src={PINK_KIT_PRODUCT.image}
                alt={PINK_KIT_PRODUCT.name}
                fill
                className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 60vw"
              />
            </div>
            <div className="p-6 sm:p-8 flex flex-col justify-center text-center md:text-left">
              <span className="text-[#E8C4B8] text-xs font-display uppercase tracking-[0.25em]">
                Paquete estrella
              </span>
              <h2 className="mt-2 text-white font-display font-bold text-xl sm:text-2xl uppercase">
                {PINK_KIT_PRODUCT.name}
              </h2>
              <p className="mt-3 text-zinc-400 text-sm leading-relaxed">
                El combo Pink Kit que usan nuestras clientas. Ver producto y comprar.
              </p>
              <span className="mt-5 inline-flex items-center justify-center md:justify-start gap-2 text-gold-metal text-sm font-display uppercase tracking-wider">
                Ver producto
                <span aria-hidden>→</span>
              </span>
            </div>
          </div>
        </Link>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {PINK_KIT_FEATURED_IMAGES.map((img) => (
            <article
              key={img.id}
              className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 aspect-[4/5] sm:aspect-[3/4] touch-manipulation"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className={PRODUCT_COVER_IMAGE_CLASS}
                sizes="(max-width: 640px) 90vw, 33vw"
              />
            </article>
          ))}
        </div>
      </section>

      {/* ── Sección 2: galería de consumidoras ── */}
      <section className="border-t border-zinc-900 bg-zinc-950/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <h2 className="font-display font-bold text-2xl sm:text-4xl uppercase tracking-tight text-white">
              Nuestras consumidoras
            </h2>
            <p className="mt-4 text-zinc-400 text-sm sm:text-base leading-relaxed">
              Miles de clientas nos avalan. Contamos con cientos de testimonios de envíos
              seguros a toda la República Mexicana.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {PINK_KIT_GALLERY_IMAGES.map((fileId, index) => (
              <article
                key={fileId}
                className="group relative overflow-hidden rounded-lg border border-zinc-800/80 bg-black aspect-square touch-manipulation"
              >
                <Image
                  src={wixMediaUrl(fileId)}
                  alt={`Testimonio Pink Kit ${index + 4}`}
                  fill
                  loading="lazy"
                  className={PRODUCT_COVER_IMAGE_CLASS}
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
              </article>
            ))}
          </div>

          <div className="mt-14 sm:mt-16 max-w-3xl mx-auto text-center space-y-6">
            <p className="text-white font-display font-bold uppercase tracking-wide text-lg sm:text-xl">
              Recuerda
            </p>
            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
              Todas nuestras compras son respaldadas por{' '}
              <span className="text-white font-semibold">Mercado Pago</span>, 100% segura.
              Mercado Libre te reembolsa tu dinero. Somos una empresa seria — no arriesgues tu
              dinero.
            </p>

            <div className="flex justify-center py-2">
              <Image
                src={PINK_KIT_TRUST_BADGE}
                alt="Mercado Pago — compra segura"
                width={438}
                height={132}
                className="h-auto w-full max-w-md object-contain opacity-95"
              />
            </div>

            <p
              className="font-display font-black uppercase tracking-wide"
              style={{ fontSize: 'clamp(1.25rem, 3vw, 2rem)', color: PINK_KIT_ACCENT }}
            >
              Miles de clientas nos avalan
            </p>

            <Link
              href="/envios"
              className="inline-flex items-center justify-center px-8 py-3 rounded-sm border border-wix-gold/40 text-gold-metal font-display text-xs uppercase tracking-[0.2em] hover:bg-wix-gold/10 transition-colors"
            >
              Envíos seguros a todo México
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
