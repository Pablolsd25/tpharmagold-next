"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export default function VideoHero() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.play().catch(() => {});
  }, []);

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-black">
      {/* Video de fondo */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        playsInline
        preload="auto"
        poster="https://static.wixstatic.com/media/d60565_a92a4ba089fb4a6d8e4893b90cef9183f001.jpg/v1/fill/w_1920,h_419,al_c,q_85/d60565_a92a4ba089fb4a6d8e4893b90cef9183f001.jpg"
      >
        <source
          src="https://video.wixstatic.com/video/d60565_a92a4ba089fb4a6d8e4893b90cef9183/720p/mp4/file.mp4"
          type="video/mp4"
        />
      </video>

      {/* Gradiente */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

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
  );
}
