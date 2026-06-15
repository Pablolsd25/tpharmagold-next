'use client'

import { useRef, useState } from 'react'

type Props = {
  src: string
  poster?: string
  title: string
  subtitle?: string
}

export default function AboutVideoPlayer({ src, poster, title, subtitle }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  function handlePlay() {
    const v = videoRef.current
    if (!v) return
    setPlaying(true)
    v.muted = false
    v.play().catch(() => {})
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-accent/30 bg-zinc-950 shadow-[0_0_60px_rgba(201,162,39,0.12)]">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent z-10" />

      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          controls={playing}
          playsInline
          preload="none"
          className="w-full h-full object-cover"
        />

        {!playing && (
          <button
            type="button"
            onClick={handlePlay}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/50 hover:bg-black/40 transition-colors group"
            aria-label={`Reproducir video ${title}`}
          >
            <span className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-accent/70 bg-black/60 group-hover:scale-105 group-hover:border-accent transition-all duration-300 shadow-[0_0_30px_rgba(201,162,39,0.35)]">
              <svg className="w-7 h-7 text-accent ml-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <div className="text-center px-4">
              <p className="text-gold-metal font-display font-bold uppercase tracking-[0.25em] text-sm">
                {title}
              </p>
              {subtitle && (
                <p className="text-zinc-400 text-xs mt-1 font-display uppercase tracking-widest">
                  {subtitle}
                </p>
              )}
            </div>
          </button>
        )}
      </div>
    </div>
  )
}
