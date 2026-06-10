import Image from "next/image";
import { LEGAL } from "@/lib/site-legal";

export default function AboutSection() {
  return (
    <section className="relative overflow-hidden bg-black border-t border-zinc-900">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(35,243,14,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(35,243,14,0.06) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center mb-16 sm:mb-20">
          <span className="inline-block text-accent font-display text-xs uppercase tracking-[0.35em] mb-4">
            ¿Quiénes somos?
          </span>
          <Image
            src="/logo.jpg"
            alt={LEGAL.tradeName}
            width={180}
            height={120}
            className="mx-auto h-24 sm:h-32 w-auto object-contain"
          />
          <p
            className="mt-3 font-display uppercase tracking-[0.15em] text-zinc-300"
            style={{ fontSize: "clamp(0.85rem, 2vw, 1.1rem)" }}
          >
            {LEGAL.tagline}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-accent/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <div className="h-px w-12 bg-accent/60" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 sm:gap-8 mb-16 sm:mb-20 max-w-3xl mx-auto">
          {[
            { value: "12", unit: "años", label: "Acompañando transformaciones" },
            { value: "100%", unit: "", label: "Pureza y verificación de laboratorio" },
            { value: "MX", unit: "", label: "Envíos seguros a todo México" },
          ].map((stat) => (
            <div key={stat.value} className="relative text-center group">
              <div
                className="absolute inset-0 rounded-xl bg-accent/5 border border-accent/10
                group-hover:bg-accent/10 group-hover:border-accent/25 transition-all duration-300"
              />
              <div className="relative py-6 px-2">
                <div
                  className="font-display font-black leading-none text-accent"
                  style={{
                    fontSize: "clamp(1.8rem, 4vw, 3rem)",
                    textShadow: "0 0 30px rgba(35,243,14,0.5)",
                  }}
                >
                  {stat.value}
                  {stat.unit && (
                    <span className="text-base sm:text-lg text-accent/70 ml-0.5">
                      {stat.unit}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-zinc-400 text-xs sm:text-sm leading-snug px-1">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto space-y-10">
          <div className="relative pl-6 border-l-2 border-accent">
            <p className="text-white font-display font-bold text-xl sm:text-2xl leading-snug">
              Ganamos competencias.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8 text-zinc-300 text-sm sm:text-base leading-relaxed">
            <p>
              En <span className="text-white font-bold">{LEGAL.tradeName}</span>,
              somos una plataforma de distribución especializada en México, con más
              de 10 años enfocada en proveer compuestos de bio-investigación,
              factores de crecimiento y soluciones de suplementación avanzada.
            </p>
            <p>
              Entendemos las exigencias del deporte de élite y el desarrollo
              biológico. Por eso nos comprometemos con la excelencia, ofreciendo
              exclusivamente productos que cumplen con los más estrictos estándares
              de{" "}
              <span className="text-accent font-bold">pureza, calidad y verificación de laboratorio</span>.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-zinc-600 text-xs uppercase tracking-widest font-display">
              T Pharma
            </span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <div className="text-center">
            <p
              className="font-display font-black uppercase text-white"
              style={{
                fontSize: "clamp(1.4rem, 3.5vw, 2.2rem)",
                textShadow: "0 0 40px rgba(35,243,14,0.15)",
              }}
            >
              Productos premium para{" "}
              <span
                className="text-accent"
                style={{ textShadow: "0 0 20px rgba(35,243,14,0.6)" }}
              >
                atletas de alto rendimiento.
              </span>
            </p>
          </div>

          <p className="text-center text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Respaldamos el trabajo de atletas de alto nivel y centros de evaluación
            física con herramientas de vanguardia tecnológica, garantizando un
            servicio transparente y envíos nacionales seguros.
          </p>
        </div>

        <div className="mt-16 sm:mt-20 text-center">
          <p
            className="font-display font-black uppercase text-white"
            style={{
              fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)",
              letterSpacing: "0.05em",
            }}
          >
            {LEGAL.tradeNameAlt}.{" "}
            <span
              className="text-accent"
              style={{ textShadow: "0 0 25px rgba(35,243,14,0.6)" }}
            >
              El mejor complemento para atletas.
            </span>
          </p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
    </section>
  );
}
