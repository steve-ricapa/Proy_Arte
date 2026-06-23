const pillars = [
  {
    index: "I",
    label: "Visibilidad",
    text: "La cultura de plataformas nos obliga a sostener una presencia constante para no salir del campo de visión colectivo. Existir digitalmente significa publicar.",
  },
  {
    index: "II",
    label: "Atención",
    text: "Cada interacción actúa como energía simbólica. Los likes, comentarios y menciones aumentan la intensidad lumínica de cada cuerpo celeste en la constelación.",
  },
  {
    index: "III",
    label: "Fatiga",
    text: "Brillar implica desgaste. El brillo permanente esconde presión, exposición y la administración constante de un yo construido para los otros.",
  },
];

export default function LandingConcept() {
  return (
    <section id="concept" className="relative py-24 overflow-hidden">
      {/* Section label */}
      <div className="flex items-center gap-4 mb-16">
        <span className="panel-title">Declaración</span>
        <hr className="cosmic-hr flex-1" />
        <span className="panel-title opacity-40">01</span>
      </div>

      {/* ── Big editorial statement ─────────────────────── */}
      <div className="mb-20">
        <h2
          className="font-black text-white leading-[0.9] tracking-tight"
          style={{ fontSize: "clamp(2.5rem, 7vw, 6rem)" }}
        >
          La presión de{" "}
          <span className="text-gradient-purple">seguir visibles.</span>
        </h2>
        <p
          className="mt-8 text-slate-300 leading-relaxed max-w-3xl"
          style={{ fontSize: "clamp(0.95rem, 1.4vw, 1.1rem)" }}
        >
          <strong className="text-white font-semibold">The Obligation to Shine</strong> explora una condición contemporánea:
          en las redes sociales no solo compartimos, también sostenemos una visibilidad.
          Cada publicación actúa como una emisión de luz que lucha contra la velocidad del olvido digital.
        </p>
      </div>

      {/* ── Three pillars, editorial grid ─────────────── */}
      <div className="grid gap-0 md:grid-cols-3">
        {pillars.map((pillar, i) => (
          <article
            key={pillar.label}
            className="relative group border-t border-purple-500/15 pt-8 pb-10 pr-8 transition-all duration-500 hover:bg-purple-950/10"
            style={{ borderRight: i < pillars.length - 1 ? "1px solid rgba(168,85,247,0.08)" : "none" }}
          >
            {/* Pillar number */}
            <span
              className="absolute top-6 right-6 font-mono text-purple-500/20 font-bold leading-none select-none"
              style={{ fontSize: "clamp(3rem, 6vw, 5rem)" }}
            >
              {pillar.index}
            </span>

            <p className="panel-title mb-5">{pillar.label}</p>
            <p
              className="text-slate-300 leading-relaxed"
              style={{ fontSize: "clamp(0.875rem, 1.2vw, 1rem)" }}
            >
              {pillar.text}
            </p>

            {/* Hover line */}
            <div className="mt-8 h-px w-0 bg-gradient-to-r from-purple-500 to-transparent transition-all duration-500 group-hover:w-16" />
          </article>
        ))}
      </div>
    </section>
  );
}
