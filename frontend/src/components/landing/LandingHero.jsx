export default function LandingHero({ onEnter }) {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden scanline">
      {/* Deep purple nebula glow background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[60vw] h-[60vh] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute bottom-0 right-0 w-[50vw] h-[50vh] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)", filter: "blur(100px)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, rgba(196,181,253,0.5) 0%, transparent 60%)", filter: "blur(60px)" }} />
      </div>

      {/* Decorative orbit rings (positioned absolutely) */}
      <div className="absolute top-[-8rem] right-[-8rem] w-[36rem] h-[36rem] rounded-full border border-purple-500/10 animate-orbit pointer-events-none" />
      <div className="absolute top-[-4rem] right-[-4rem] w-[28rem] h-[28rem] rounded-full border border-dashed border-purple-500/8 pointer-events-none"
        style={{ animation: "orbit-slow 45s linear infinite reverse" }} />
      <div className="absolute bottom-[-6rem] left-[-6rem] w-[30rem] h-[30rem] rounded-full border border-indigo-500/8 animate-orbit pointer-events-none" />

      {/* ── Main Content ────────────────────────────────── */}
      <div className="relative z-10 w-full">
        {/* Top label strip */}
        <div className="flex items-center gap-6 mb-12">
          <span className="panel-title opacity-70">UTEC</span>
          <div className="h-px flex-1 max-w-[3rem] bg-purple-500/30" />
          <span className="panel-title opacity-70">Arte y Tecnología</span>
          <div className="h-px flex-1 max-w-[3rem] bg-purple-500/30" />
          <span className="panel-title opacity-70">2026·1</span>
        </div>

        {/* ── Giant title + Logo row ─────────────────── */}
        <div className="relative flex items-center gap-8 md:gap-12">
          {/* Title block */}
          <div className="flex-1">
            <h1
              className="font-black leading-[0.88] tracking-tight text-white"
              style={{ fontSize: "clamp(3.5rem, 11vw, 9rem)" }}
            >
              <span className="block">The</span>
              <span className="block">Obligation</span>
              <span className="block">
                to{" "}
                <span className="text-gradient-purple text-glow-purple">Shine</span>
              </span>
            </h1>

            {/* Translation note */}
            <p
              className="mt-4 font-mono text-purple-400/60 italic tracking-widest"
              style={{ fontSize: "clamp(0.7rem, 1.2vw, 0.85rem)" }}
            >
              — La obligación de brillar —
            </p>

            {/* ── CTA buttons — right after the title ─────── */}
            <div className="mt-8 flex flex-wrap gap-4">
              <button onClick={onEnter} className="btn-cosmic-solid">
                Entrar a la experiencia
              </button>
              <a href="#concept" className="btn-cosmic text-center">
                Leer concepto
              </a>
            </div>

            {/* ── Divider + Body text ──────────────────────── */}
            <div className="mt-8 max-w-2xl">
              <hr className="cosmic-hr mb-6" />
              <p
                className="text-slate-300 leading-relaxed"
                style={{ fontSize: "clamp(1rem, 1.6vw, 1.2rem)" }}
              >
                Una obra digital que convierte la actividad de un perfil de Instagram en una{" "}
                <em className="text-purple-300 not-italic font-semibold">constelación generativa</em>.
                Cada publicación emite luz, ocupa espacio y compite por permanecer visible dentro de una memoria social artificial.
              </p>
            </div>
          </div>

          {/* App logo — to the right of the title */}
          <div className="shrink-0 hidden sm:flex items-center justify-center">
            <img
              src="/logo-app-arte.png"
              alt="The Obligation to Shine — Logo"
              className="animate-float"
              style={{
                width: "clamp(19.6rem, 44vw, 44rem)",
                filter: "drop-shadow(0 0 30px rgba(168,85,247,0.35)) drop-shadow(0 0 60px rgba(124,58,237,0.15))",
              }}
            />
          </div>
        </div>

        {/* ── Scroll indicator ─────────────────────────── */}
        <div className="mt-16 flex items-center gap-4 opacity-40">
          <div className="w-6 h-10 rounded-full border border-purple-500/50 flex items-start justify-center pt-2">
            <div className="w-1 h-2 bg-purple-400 rounded-full" style={{ animation: "float-slow 2s ease-in-out infinite" }} />
          </div>
          <span className="panel-title">Scroll para explorar</span>
        </div>
      </div>
    </section>
  );
}
