'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useCartStore } from '@/lib/store/cart'
import type { Product } from '@/types'

export default function ProductDetail({ product }: { product: Product }) {
  const [qty, setQty] = useState(1)
  const [activeImg, setActiveImg] = useState(0)
  const addItem = useCartStore((s) => s.addItem)

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.compare_at_price!) * 100)
    : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      {/* Imágenes */}
      <div className="space-y-3">
        <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-900">
          {product.images[activeImg] ? (
            <Image
              src={product.images[activeImg]}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-700">
              <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {product.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors
                  ${activeImg === i ? 'border-white' : 'border-zinc-700'}`}
              >
                <Image src={img} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-5">
        {product.category && (
          <span className="text-zinc-500 text-sm uppercase tracking-wider">
            {product.category.name}
          </span>
        )}

        <h1 className="text-white font-black text-3xl leading-tight">{product.name}</h1>

        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-3xl">${product.price.toFixed(2)}</span>
          {hasDiscount && (
            <>
              <span className="text-zinc-500 text-xl line-through">${product.compare_at_price!.toFixed(2)}</span>
              <span className="bg-red-600 text-white text-sm font-bold px-2 py-0.5 rounded">-{discountPct}%</span>
            </>
          )}
          <span className="text-zinc-500 text-sm ml-1">MXN</span>
        </div>

        {product.description && (
          <div
            className="product-description text-zinc-400 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        )}

        {/* Stock */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-zinc-400 text-sm">
            {product.stock > 0 ? `${product.stock} en stock` : 'Sin stock'}
          </span>
        </div>

        {/* Cantidad */}
        {product.stock > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-zinc-400 text-sm">Cantidad:</span>
            <div className="flex items-center border border-zinc-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                −
              </button>
              <span className="px-4 py-2 text-white font-medium min-w-[3rem] text-center">{qty}</span>
              <button
                onClick={() => setQty(Math.min(product.stock, qty + 1))}
                className="px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => addItem(product, qty)}
          disabled={product.stock === 0}
          className="bg-white text-black font-bold py-4 rounded-xl text-lg
            hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {product.stock === 0 ? 'Producto agotado' : 'Agregar al carrito'}
        </button>

        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {product.tags.map((tag) => (
              <span key={tag} className="bg-zinc-800 text-zinc-400 text-xs px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
