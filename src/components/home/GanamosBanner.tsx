import Image from 'next/image'
import { canonicalImageUrl } from '@/lib/wix-media'
import { PRODUCT_COVER_IMAGE_CLASS } from '@/lib/product-image-styles'

type Props = { showcaseImage: string }

/** Split: "Ganamos Competencias" + imagen Transforma tu entrenamiento */
export default function GanamosBanner({ showcaseImage }: Props) {
  return (
    <section className="bg-black border-t border-zinc-900/50">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="text-center md:text-left py-8 md:py-12">
            <h2
              className="font-display font-bold text-gold-metal leading-[1.1]"
              style={{ fontSize: 'clamp(2.2rem, 6vw, 4rem)' }}
            >
              Ganamos Competencias
            </h2>
          </div>

          <div className="relative mx-auto w-full max-w-[420px]">
            <div className="group relative border border-wix-gold/40 shadow-[0_0_30px_rgba(201,162,39,0.18)] overflow-hidden aspect-square">
              <Image
                src={canonicalImageUrl(showcaseImage)}
                alt="Transforma tu entrenamiento"
                fill
                className={PRODUCT_COVER_IMAGE_CLASS}
                sizes="(max-width: 768px) 90vw, 420px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-center pointer-events-none">
                <p
                  className="font-display font-black uppercase text-gold-metal leading-none tracking-wide"
                  style={{
                    fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                    textShadow: '0 2px 8px rgba(61,47,10,0.6)',
                  }}
                >
                  TRANSFORMA
                </p>
                <p className="mt-1 font-display font-semibold uppercase text-wix-gold text-sm sm:text-base tracking-[0.2em]">
                  TU ENTRENAMIENTO
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
