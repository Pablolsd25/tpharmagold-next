import Image from "next/image";

export default function AboutSection() {
  return (
    <section className="relative overflow-hidden bg-black border-t border-zinc-900">
      {/* Background subtle grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(35,243,14,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(35,243,14,0.06) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        {/* Header */}
        <div className="text-center mb-16 sm:mb-20">
          <span className="inline-block text-accent font-display text-xs uppercase tracking-[0.35em] mb-4">
            Nuestra historia
          </span>
          <Image
            src="/logo.jpg"
            alt="Casa Empire"
            width={180}
            height={120}
            className="mx-auto h-24 sm:h-32 w-auto object-contain"
          />
          <p
            className="mt-3 font-display uppercase tracking-[0.15em] text-zinc-300"
            style={{ fontSize: "clamp(0.85rem, 2vw, 1.1rem)" }}
          >
            Donde la transformación se vuelve tu estándar
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-accent/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <div className="h-px w-12 bg-accent/60" />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 sm:gap-8 mb-16 sm:mb-20 max-w-3xl mx-auto">
          {[
            {
              value: "5",
              unit: "años",
              label: "Dominando el mercado mexicano",
            },
            { value: "+50K", unit: "", label: "Transformaciones documentadas" },
            {
              value: "#1",
              unit: "",
              label: "Suplemento para atletas con pesas",
            },
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

        {/* Main content */}
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Pull quote */}
          <div className="relative pl-6 border-l-2 border-accent">
            <p className="text-white font-display font-bold text-xl sm:text-2xl leading-snug">
              Llegaste al lugar correcto.
            </p>
          </div>

          {/* Body text */}
          <div className="grid sm:grid-cols-2 gap-8 text-zinc-300 text-sm sm:text-base leading-relaxed">
            <p>
              Aquí entendemos algo que otros no: no entrenas solo por salud.
              Entrenas por{" "}
              <span className="text-white font-semibold">estética</span>. Por
              verte al espejo y que el trabajo{" "}
              <span className="text-accent font-bold">SÍ se note</span>. Por ese
              respeto que impone un físico trabajado.
            </p>
            <p>
              Por eso creamos{" "}
              <span className="text-white font-bold">CASA EMPIRE</span>.
              Suplementos diseñados para acelerar lo que ya haces en el gym.
              Para que cada repetición cuente. Para que cada gota de sudor
              construya el cuerpo que tienes en la cabeza.
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-zinc-600 text-xs uppercase tracking-widest font-display">
              Empire
            </span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* Bold statement */}
          <div className="text-center">
            <p
              className="font-display font-black uppercase text-white"
              style={{
                fontSize: "clamp(1.4rem, 3.5vw, 2.2rem)",
                textShadow: "0 0 40px rgba(35,243,14,0.15)",
              }}
            >
              No prometemos objetivos.{" "}
              <span
                className="text-accent"
                style={{ textShadow: "0 0 20px rgba(35,243,14,0.6)" }}
              >
                Entregamos resultados.
              </span>
            </p>
          </div>

          {/* Closing paragraph */}
          <p className="text-center text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Miles de atletas, competidores y guerreros del día a día ya
            construyeron su imperio con nosotros.{" "}
            <span className="text-white font-semibold">
              Ahora te toca a ti.
            </span>
          </p>
        </div>

        {/* Misión & Visión */}
        <div className="mt-20 sm:mt-28 grid sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Misión */}
          <div className="relative rounded-2xl overflow-hidden border border-accent/20 bg-zinc-950/80 p-8 group hover:border-accent/40 transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent/10 border border-accent/20">
                <svg
                  className="w-4 h-4 text-accent"
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
                className="font-display font-black uppercase tracking-widest text-accent text-sm"
                style={{ textShadow: "0 0 15px rgba(35,243,14,0.4)" }}
              >
                Nuestra Misión
              </span>
            </div>
            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
              Equipar a hombres y mujeres que entrenan con peso con suplementos
              de grado atleta que convierten su disciplina en el gimnasio en{" "}
              <span className="text-white font-semibold">
                resultados físicos brutales
              </span>
              . Romper el estándar de lo &ldquo;promedio&rdquo; y demostrar que
              la estética de alto nivel se construye con{" "}
              <span className="text-accent font-semibold">
                ciencia, constancia y productos que sí pegan
              </span>
              .
            </p>
          </div>

          {/* Visión */}
          <div className="relative rounded-2xl overflow-hidden border border-zinc-700/40 bg-zinc-950/80 p-8 group hover:border-accent/40 transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-600/60 to-transparent group-hover:via-accent/40 transition-all duration-300" />
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 group-hover:bg-accent/10 group-hover:border-accent/20 transition-all duration-300">
                <svg
                  className="w-4 h-4 text-zinc-400 group-hover:text-accent transition-colors duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"
                  />
                </svg>
              </div>
              <span className="font-display font-black uppercase tracking-widest text-zinc-400 group-hover:text-white text-sm transition-colors duration-300">
                Nuestra Visión
              </span>
            </div>
            <p className="text-zinc-400 group-hover:text-zinc-300 text-sm sm:text-base leading-relaxed transition-colors duration-300">
              Ser el{" "}
              <span className="text-white font-semibold">
                imperio líder de suplementación deportiva en Latinoamérica
              </span>
              . La marca que defina el estándar de transformación estética para
              quienes se niegan a conformarse. Que cuando pienses en un físico
              dominante,{" "}
              <span className="text-accent font-semibold">
                pienses en CASA EMPIRE
              </span>
              .
            </p>
          </div>
        </div>

        {/* Final tagline */}
        <div className="mt-16 sm:mt-20 text-center">
          <p
            className="font-display font-black uppercase text-white"
            style={{
              fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)",
              letterSpacing: "0.05em",
            }}
          >
            Casa Empire.{" "}
            <span
              className="text-accent"
              style={{ textShadow: "0 0 25px rgba(35,243,14,0.6)" }}
            >
              El imperio de tu estética empieza aquí.
            </span>
          </p>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
    </section>
  );
}
