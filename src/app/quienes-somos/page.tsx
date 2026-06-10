import type { Metadata } from "next";
import Image from "next/image";
import { LEGAL } from "@/lib/site-legal";

export const metadata: Metadata = {
  title: "Quiénes Somos",
  description:
    "T Pharma Gold: plataforma de distribución especializada en suplementación avanzada, factores de crecimiento y bio-investigación para atletas de alto rendimiento en México.",
};

export default function QuienesSomosPage() {
  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(35,243,14,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(35,243,14,0.07) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-96 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(35,243,14,0.10) 0%, transparent 70%)",
        }}
      />

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center mb-20">
          <span className="inline-block text-accent font-display text-xs uppercase tracking-[0.4em] mb-6">
            {LEGAL.tradeNameAlt}
          </span>
          <h1
            className="font-display font-black uppercase text-white leading-none"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}
          >
            Quiénes Somos
          </h1>
          <div className="mt-6 flex items-center justify-center gap-3">
            <div className="h-px w-16 bg-accent/50" />
            <div
              className="w-2 h-2 rounded-full bg-accent"
              style={{ boxShadow: "0 0 10px rgba(35,243,14,0.8)" }}
            />
            <div className="h-px w-16 bg-accent/50" />
          </div>
        </div>

        <div className="max-w-3xl mx-auto mb-16">
          <p className="text-zinc-300 text-base sm:text-lg leading-relaxed text-center">
            En {LEGAL.tradeName}, somos una plataforma de distribución especializada
            en México, por más de 10 años enfocada en proveer compuestos de
            bio-investigación, factores de crecimiento y soluciones de
            suplementación avanzada para atletas de alto rendimiento y
            profesionales del sector experimental.
          </p>
          <p className="mt-6 text-zinc-400 text-base sm:text-lg leading-relaxed text-center">
            Entendemos las exigencias del deporte de élite y el desarrollo biológico.
            Por ello, nos comprometemos con la excelencia, ofreciendo exclusivamente
            productos que cumplen con los más estrictos estándares de pureza,
            calidad y verificación de laboratorio.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mb-16">
          <div className="relative rounded-2xl border border-accent/25 bg-zinc-950 overflow-hidden group hover:border-accent/50 transition-all duration-500">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
            <div className="p-8 sm:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 border border-accent/30">
                  <svg
                    className="w-5 h-5 text-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <span
                  className="font-display font-black uppercase tracking-[0.25em] text-accent text-sm"
                  style={{ textShadow: "0 0 12px rgba(35,243,14,0.5)" }}
                >
                  Nuestro compromiso
                </span>
              </div>
              <p className="text-zinc-300 text-base sm:text-lg leading-relaxed">
                Respaldamos el trabajo de atletas de alto nivel y centros de
                evaluación física con herramientas de vanguardia tecnológica,
                garantizando un servicio transparente, envíos nacionales seguros
                y soluciones analíticas de la más alta fidelidad en el mercado.
              </p>
            </div>
          </div>

          <div className="relative rounded-2xl border border-zinc-700/50 bg-zinc-950 overflow-hidden group hover:border-accent/40 transition-all duration-500">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-600 to-transparent group-hover:via-accent/60 transition-all duration-500" />
            <div className="p-8 sm:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 group-hover:bg-accent/10 group-hover:border-accent/30 transition-all duration-500">
                  <svg
                    className="w-5 h-5 text-zinc-500 group-hover:text-accent transition-colors duration-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                </div>
                <span className="font-display font-black uppercase tracking-[0.25em] text-zinc-400 group-hover:text-white text-sm transition-colors duration-500">
                  Productos premium
                </span>
              </div>
              <p className="text-zinc-400 group-hover:text-zinc-300 text-base sm:text-lg leading-relaxed transition-colors duration-500">
                Explora nuestra línea de suplementos, fórmulas de rendimiento
                avanzado, suplementación de vanguardia y productos legendarios
                diseñados para quienes buscan resultados reales y duraderos.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-16">
          <div className="flex-1 h-px bg-zinc-800" />
          <Image
            src="/logo.jpg"
            alt={LEGAL.tradeName}
            width={48}
            height={32}
            className="h-8 w-auto object-contain opacity-60"
          />
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        <div className="text-center">
          <p
            className="font-display font-black uppercase text-white"
            style={{
              fontSize: "clamp(1.2rem, 3vw, 2rem)",
              letterSpacing: "0.04em",
            }}
          >
            {LEGAL.tradeNameAlt}.{" "}
            <span
              className="text-accent"
              style={{ textShadow: "0 0 30px rgba(35,243,14,0.7)" }}
            >
              {LEGAL.tagline}
            </span>
          </p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
    </div>
  );
}
