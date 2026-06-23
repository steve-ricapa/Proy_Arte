import LandingHero from "../components/landing/LandingHero";
import LandingConcept from "../components/landing/LandingConcept";
import LandingProcess from "../components/landing/LandingProcess";
import LandingCta from "../components/landing/LandingCta";
import CosmicBackground from "../components/landing/CosmicBackground";

export default function LandingPage({ onEnter }) {
  return (
    <>
      <CosmicBackground />
      {/* Single column, full-bleed editorial layout */}
      <main
        className="relative z-10 mx-auto"
        style={{ maxWidth: "min(1400px, 92vw)", padding: "4rem 0 0" }}
      >
        <LandingHero onEnter={onEnter} />

        {/* Cosmic section divider with constellation image */}
        <div className="relative py-16 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <hr className="cosmic-hr w-full" />
          </div>
          <div className="relative glass-panel overflow-hidden w-full max-w-2xl mx-auto aspect-video">
            <img
              src="/constellation_hero.png"
              alt="Constelación Digital Generativa"
              className="w-full h-full object-cover opacity-90 transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 flex items-end p-8">
              <p className="font-mono text-xs tracking-[0.2em] text-purple-300/80 uppercase">
                Representación generativa · Cartografía de presencia digital
              </p>
            </div>
          </div>
        </div>

        <LandingConcept />
        <LandingProcess />
        <LandingCta onEnter={onEnter} />
      </main>
    </>
  );
}
