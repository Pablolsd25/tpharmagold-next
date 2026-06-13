'use client'

import { useEffect, useRef } from 'react'
import {
  DEFAULT_HOME_VIDEO_480,
  DEFAULT_HOME_VIDEO_POSTER,
} from '@/lib/home-video'

type Props = {
  video480?: string
  poster?: string
}

/** Video gym centrado — primera sección de tpharmagold.com */
export default function HomeIntroVideo({
  video480 = DEFAULT_HOME_VIDEO_480,
  poster = DEFAULT_HOME_VIDEO_POSTER,
}: Props) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    v.muted = true
    v.play().catch(() => {})
  }, [video480])

  return (
    <section className="bg-black py-6 sm:py-10">
      <div className="max-w-[920px] mx-auto px-4 sm:px-6">
        <div className="relative border border-wix-gold/20 bg-black overflow-hidden shadow-[0_0_36px_rgba(201,162,39,0.08)]">
          <video
            ref={ref}
            className="w-full aspect-video object-cover bg-black"
            poster={poster}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          >
            <source src={video480} type="video/mp4" />
          </video>
        </div>
      </div>
    </section>
  )
}
