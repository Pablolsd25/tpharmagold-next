'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/cart'
import type { Product } from '@/types'

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.compare_at_price!) * 100)
    : 0

  return (
    <div className="group bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-all duration-300">
      {/* Imagen */}
      <Link href={`/producto/${product.slug}`} className="block relative aspect-[3/4] overflow-hidden bg-black">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Badge descuento */}
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
            -{discountPct}%
          </span>
        )}

        {/* Sin stock */}
        {product.stock === 0 && (
          <span className="absolute top-2 right-2 bg-black/80 text-zinc-400 text-xs px-2 py-0.5 rounded">
            Agotado
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="p-4">
        <Link href={`/producto/${product.slug}`}>
          <h3 className="text-white font-medium text-sm leading-tight hover:text-zinc-300 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-2 mt-2">
          <span className="text-white font-semibold">${product.price.toFixed(2)}</span>
          {hasDiscount && (
            <span className="text-zinc-500 text-sm line-through">${product.compare_at_price!.toFixed(2)}</span>
          )}
          <span className="text-zinc-500 text-xs ml-auto">MXN</span>
        </div>

        <button
          onClick={() => addItem(product)}
          disabled={product.stock === 0}
          className="mt-3 w-full btn-accent text-sm py-2 rounded-sm
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {product.stock === 0 ? 'Agotado' : 'Agregar al carrito'}
        </button>
      </div>
    </div>
  )
}
