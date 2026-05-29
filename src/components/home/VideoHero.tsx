'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'

export default function VideoHero() {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)

  function unmute() {
    if (videoRef.current) {
      videoRef.current.muted = false
      setMuted(false)
    }
  }

  function mute() {
    if (videoRef.current) {
      videoRef.current.muted = true
      setMuted(true)
    }
  }

  return (
    <section
      className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-black cursor-pointer"
      onMouseEnter={unmute}
      onMouseLeave={mute}
    >
      {/* Video de fondo */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster="https://static.wixstatic.com/media/d60565_a92a4ba089fb4a6d8e4893b90cef9183f001.jpg/v1/fill/w_1920,h_419,al_c,q_85/d60565_a92a4ba089fb4a6d8e4893b90cef9183f001.jpg"
      >
        <source
          src="https://video.wixstatic.com/video/d60565_a92a4ba089fb4a6d8e4893b90cef9183/1080p/mp4/file.mp4"
          type="video/mp4"
          media="(min-width: 1024px)"
        />
        <source
          src="https://video.wixstatic.com/video/d60565_a92a4ba089fb4a6d8e4893b90cef9183/720p/mp4/file.mp4"
          type="video/mp4"
        />
      </video>

      {/* Gradiente */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

      {/* Indicador de audio — esquina inferior derecha */}
      <div className="absolute bottom-5 right-5 z-20 flex items-center gap-2
        bg-black/60 backdrop-blur-sm border border-zinc-700 rounded-full px-3 py-1.5
        transition-all duration-300"
      >
        {muted ? (
          <>
            {/* Altavoz mute */}
            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
            <span className="text-zinc-400 text-[10px] font-display uppercase tracking-wider hidden sm:inline">
              Pasa el cursor
            </span>
          </>
        ) : (
          <>
            {/* Altavoz con sonido + ondas animadas */}
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M15.536 8.464a5 5 0 010 7.072M12 6.253v11.494m0 0l-4.414-4.415H4a1 1 0 01-1-1V11.67a1 1 0 011-1h3.586L12 6.253z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M18.364 5.636a9 9 0 010 12.728" />
            </svg>
            <span className="text-accent text-[10px] font-display uppercase tracking-wider hidden sm:inline animate-pulse">
              Sonido activado
            </span>
          </>
        )}
      </div>

      {/* Contenido */}
      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/tienda"
            className="btn-accent px-10 py-3 rounded-sm text-base"
          >
            Ver Tienda
          </Link>
          <Link
            href="/ofertas"
            className="border border-accent text-accent font-display font-semibold px-10 py-3 rounded-sm text-base uppercase tracking-wide hover:bg-accent hover:text-black transition-all"
          >
            Nuestras Ofertas
          </Link>
        </div>
      </div>
    </section>
  )
}
