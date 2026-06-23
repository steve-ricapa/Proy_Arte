export default function LandingCta({ onEnter }) {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Section separator */}
      <div className="flex items-center gap-4 mb-20">
        <span className="panel-title">Instalación</span>
        <hr className="cosmic-hr flex-1" />
        <span className="panel-title opacity-40">03</span>
      </div>

      {/* ── Full-width dramatic CTA block ───────────────── */}
      <div className="relative rounded-[2.5rem] overflow-hidden border border-purple-500/15 bg-[radial-gradient(ellipse_at_top_left,rgba(124,58,237,0.12),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.08),transparent_60%)] p-12 md:p-20">

        {/* Corner decorations */}
        <div className="absolute top-8 left-8 w-24 h-24 rounded-full border border-purple-500/10 animate-orbit" />
        <div className="absolute bottom-8 right-8 w-16 h-16 rounded-full border border-purple-500/10"
          style={{ animation: "orbit-slow 20s linear infinite reverse" }} />

        {/* Glow blob */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] opacity-30 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(168,85,247,0.4) 0%, transparent 70%)", filter: "blur(40px)" }} />

        {/* Content */}
        <div className="relative z-10">
          {/* Big text */}
          <h2
            className="font-black text-white leading-[0.88] tracking-tight mb-8"
            style={{ fontSize: "clamp(2.8rem, 7vw, 6.5rem)" }}
          >
            Ingresa tu username.<br />
            <span className="text-gradient-purple">Observa tu universo.</span>
          </h2>

          <p
            className="text-slate-300 leading-relaxed max-w-2xl mb-14"
            style={{ fontSize: "clamp(0.95rem, 1.4vw, 1.15rem)" }}
          >
            Analiza un perfil real de Instagram y observa cómo su actividad se transforma en un sistema estelar de exposición, atención y permanencia digital.
          </p>

          <div className="flex flex-wrap gap-4 items-center">
            <button onClick={onEnter} className="btn-cosmic-solid">
              Iniciar Experiencia →
            </button>
            <span className="font-mono text-xs text-purple-500/50 tracking-widest">UTEC · Arte y Tecnología · 2026-1</span>
          </div>
        </div>
      </div>

      {/* ── Footer strip ────────────────────────────────── */}
      <div className="mt-16 flex items-center justify-between opacity-40">
        <span className="panel-title">The Obligation to Shine</span>
        <span className="panel-title">React · p5.js · Apify</span>
      </div>
    </section>
  );
}
