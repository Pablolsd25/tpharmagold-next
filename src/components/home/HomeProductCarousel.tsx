'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import HomeProductCard from '@/components/home/HomeProductCard'
import type { Product } from '@/types'

type Props = {
  products: Product[]
}

const LOOP_COPIES = 3

export default function HomeProductCarousel({ products }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const segmentWidthRef = useRef(0)
  const jumpingRef = useRef(false)
  const [ready, setReady] = useState(false)

  const loopProducts = useMemo(() => {
    if (products.length <= 1) return products
    return Array.from({ length: LOOP_COPIES }, () => products).flat()
  }, [products])

  const measureSegment = useCallback(() => {
    const el = trackRef.current
    if (!el || products.length === 0) return 0

    const cards = el.querySelectorAll<HTMLElement>('[data-carousel-card]')
    if (cards.length < products.length) return 0

    const first = cards[0]
    const last = cards[products.length - 1]
    return last.offsetLeft + last.offsetWidth - first.offsetLeft
  }, [products.length])

  useLayoutEffect(() => {
    const el = trackRef.current
    if (!el || products.length <= 1) {
      setReady(true)
      return
    }

    const segment = measureSegment()
    if (segment <= 0) return

    segmentWidthRef.current = segment
    jumpingRef.current = true
    el.style.scrollBehavior = 'auto'
    el.scrollLeft = segment
    el.style.scrollBehavior = ''
    jumpingRef.current = false
    setReady(true)
  }, [products, measureSegment])

  useEffect(() => {
    const el = trackRef.current
    if (!el || products.length <= 1) return

    function onScroll() {
      if (jumpingRef.current) return
      const segment = segmentWidthRef.current
      if (segment <= 0) return

      const { scrollLeft } = el!
      if (scrollLeft < segment * 0.25) {
        jumpingRef.current = true
        el!.style.scrollBehavior = 'auto'
        el!.scrollLeft += segment
        el!.style.scrollBehavior = ''
        jumpingRef.current = false
      } else if (scrollLeft > segment * 1.75) {
        jumpingRef.current = true
        el!.style.scrollBehavior = 'auto'
        el!.scrollLeft -= segment
        el!.style.scrollBehavior = ''
        jumpingRef.current = false
      }
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [products.length])

  function scroll(dir: 'left' | 'right') {
    const el = trackRef.current
    if (!el) return

    const card = el.querySelector<HTMLElement>('[data-carousel-card]')
    const gap = 12
    const amount = card ? card.offsetWidth + gap : el.clientWidth * 0.9
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  if (products.length === 0) return null

  return (
    <div className={`relative transition-opacity duration-150 ${ready ? 'opacity-100' : 'opacity-0'}`}>
      {products.length > 1 && (
        <button
          type="button"
          onClick={() => scroll('left')}
          aria-label="Anterior"
          className="absolute -left-1 sm:left-0 top-[38%] -translate-y-1/2 z-10 w-8 h-12 flex items-center justify-center text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <div
        ref={trackRef}
        className="flex gap-3 overflow-x-auto scroll-smooth pb-2 scrollbar-hide -mx-1 px-1"
        style={{ scrollSnapType: 'x proximity' }}
      >
        {loopProducts.map((product, index) => (
          <div
            key={`${product.id}-${index}`}
            data-carousel-card
            className="shrink-0 w-[46%] sm:w-[31%] lg:w-[23%] min-w-[148px] max-w-[220px]"
            style={{ scrollSnapAlign: 'start' }}
          >
            <HomeProductCard product={product} />
          </div>
        ))}
      </div>

      {products.length > 1 && (
        <button
          type="button"
          onClick={() => scroll('right')}
          aria-label="Siguiente"
          className="absolute -right-1 sm:right-0 top-[38%] -translate-y-1/2 z-10 w-8 h-12 flex items-center justify-center text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  )
}
