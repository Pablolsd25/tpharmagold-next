import Image from 'next/image'
import Link from 'next/link'
import { canonicalImageUrl } from '@/lib/wix-media'
import {
  PRODUCT_COVER_IMAGE_CLASS,
  PRODUCT_COVER_IMAGE_PRIMARY_SWAP_CLASS,
  PRODUCT_COVER_IMAGE_SECONDARY_CLASS,
} from '@/lib/product-image-styles'
import type { Product } from '@/types'

type Props = { product: Product }

/** Tarjeta Wix: imagen + barra negra con nombre y precio */
export default function HomeProductCard({ product }: Props) {
  const hasDiscount =
    product.compare_at_price != null && product.compare_at_price > product.price
  const hasSecondImage = Boolean(product.images[1])

  return (
    <Link href={`/producto/${product.slug}`} className="group block h-full touch-manipulation">
      <article className="h-full flex flex-col border border-zinc-800 bg-black hover:border-zinc-600 active:border-zinc-500 transition-colors">
        <div className="relative aspect-square overflow-hidden bg-black">
          {product.images[0] ? (
            <>
              <Image
                src={canonicalImageUrl(product.images[0])}
                alt={product.name}
                fill
                loading="lazy"
                sizes="(max-width: 640px) 56vw, (max-width: 1024px) 32vw, 280px"
                className={
                  hasSecondImage
                    ? PRODUCT_COVER_IMAGE_PRIMARY_SWAP_CLASS
                    : PRODUCT_COVER_IMAGE_CLASS
                }
              />
              {hasSecondImage && (
                <Image
                  src={canonicalImageUrl(product.images[1])}
                  alt={`${product.name} — vista alternativa`}
                  fill
                  loading="lazy"
                  sizes="(max-width: 640px) 56vw, (max-width: 1024px) 32vw, 280px"
                  className={PRODUCT_COVER_IMAGE_SECONDARY_CLASS}
                />
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-700 text-xs">
              Sin imagen
            </div>
          )}
        </div>

        <div className="flex-1 p-3 sm:p-4 bg-black border-t border-zinc-800 text-center min-h-[84px] sm:min-h-[88px] flex flex-col justify-center">
          <h3 className="text-white text-[11px] sm:text-xs uppercase leading-snug line-clamp-2 font-normal">
            {product.name}
          </h3>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-white text-sm sm:text-base font-normal">
              ${product.price.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {hasDiscount && (
              <span className="text-zinc-500 text-xs line-through">
                ${product.compare_at_price!.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
