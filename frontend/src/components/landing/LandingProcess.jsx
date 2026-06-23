const steps = [
  {
    index: "01",
    title: "Recolección",
    detail: "Apify · Instagram Scraper",
    text: "El sistema extrae publicaciones, fechas, hashtags, menciones y métricas de interacción del perfil elegido.",
  },
  {
    index: "02",
    title: "Traducción",
    detail: "Algoritmo Determinista",
    text: "Cada post se convierte en un planeta o satélite. Su tamaño refleja alcance, su brillo refleja atención, su órbita refleja el tiempo.",
  },
  {
    index: "03",
    title: "Exhibición",
    detail: "p5.js · Canvas 2D",
    text: "La constelación resultante hace visible la tensión entre el deseo de conexión y la necesidad constante de brillar para no desaparecer.",
  },
];

export default function LandingProcess() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-4 mb-16">
        <span className="panel-title">Método</span>
        <hr className="cosmic-hr flex-1" />
        <span className="panel-title opacity-40">02</span>
      </div>

      {/* ── Title ───────────────────────────────────────── */}
      <h2
        className="font-black text-white leading-[0.9] tracking-tight mb-20"
        style={{ fontSize: "clamp(2.5rem, 6vw, 5.5rem)" }}
      >
        Del rastro social{" "}
        <br className="hidden md:block" />
        <span className="text-gradient-purple">a la forma cósmica.</span>
      </h2>

      {/* ── Steps: horizontal timeline cards ───────────── */}
      <div className="relative">
        {/* Connecting line */}
        <div
          className="absolute top-12 left-0 right-0 h-px hidden md:block"
          style={{ background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.2) 20%, rgba(168,85,247,0.2) 80%, transparent)" }}
        />

        <div className="grid md:grid-cols-3 gap-8 md:gap-6">
          {steps.map((step) => (
            <article
              key={step.index}
              className="group relative"
            >
              {/* Step node on timeline */}
              <div className="relative z-10 flex items-center gap-4 mb-8">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black border border-purple-500/40 group-hover:border-purple-400 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-400">
                  <span className="font-mono text-xs font-bold text-purple-400">{step.index}</span>
                </div>
                <div className="h-px flex-1 bg-purple-500/20 group-hover:bg-purple-400/40 transition-colors duration-400" />
              </div>

              {/* Card */}
              <div className="glass-panel p-7">
                {/* Tech detail */}
                <p className="font-mono text-[10px] tracking-[0.2em] text-purple-500/60 uppercase mb-4">{step.detail}</p>

                <h3
                  className="font-black text-white mb-4"
                  style={{ fontSize: "clamp(1.4rem, 2.5vw, 2rem)" }}
                >
                  {step.title}
                </h3>

                <p
                  className="text-slate-400 leading-relaxed"
                  style={{ fontSize: "clamp(0.85rem, 1.1vw, 0.95rem)" }}
                >
                  {step.text}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
