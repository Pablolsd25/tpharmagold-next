"use client";

import Image from "next/image";
import { useState } from "react";
import { LEGAL } from "@/lib/site-legal";

export default function BrandBanner() {
  const [imgError, setImgError] = useState(false);

  if (!imgError) {
    return (
      <div className="relative w-full overflow-hidden bg-black">
        <Image
          src="/brand-banner.png"
          alt={`${LEGAL.tradeName} — ${LEGAL.tagline}`}
          width={1920}
          height={400}
          className="w-full h-auto object-cover"
          priority={false}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden bg-black py-20 sm:py-28 flex items-center justify-center">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,197,94,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.12) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-150 h-75 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse, rgba(34,197,94,0.18) 0%, transparent 70%)",
          }}
        />
      </div>
      <div className="relative z-10 text-center px-4">
        <h2
          className="font-display font-bold uppercase tracking-widest"
          style={{
            fontSize: "clamp(2.5rem, 7vw, 5.5rem)",
            color: "#22c55e",
            textShadow:
              "0 0 20px rgba(34,197,94,0.8), 0 0 60px rgba(34,197,94,0.4), 0 0 100px rgba(34,197,94,0.2)",
          }}
        >
          {LEGAL.tradeNameAlt}
        </h2>
        <p
          className="mt-3 font-display uppercase tracking-[0.3em] text-white/80"
          style={{
            fontSize: "clamp(1rem, 3vw, 1.6rem)",
            textShadow: "0 0 10px rgba(255,255,255,0.3)",
          }}
        >
          {LEGAL.tagline}
        </p>
      </div>
    </div>
  );
}
