import { useCallback, useMemo, useRef, useState } from "react";
import { ReactP5Wrapper, Sketch, P5CanvasInstance } from "@p5-wrapper/react";

import { useArtworkExport } from "./hooks/useArtworkExport";
import { buildSceneConfig } from "./scene/buildSceneConfig";
import { drawScene } from "./render/drawScene";
import { InstagramAnalysisPayload, SceneConfig, StarNode } from "./types/artwork.types";
import HoverInfoPanel from "./HoverInfoPanel";

type DigitalExposureArtworkProps = {
  data: InstagramAnalysisPayload;
  width?: number;
  height?: number;
};

type SketchProps = {
  payload: InstagramAnalysisPayload;
  width: number;
  height: number;
  onHover: (node: StarNode | null) => void;
};

const FALLBACK_WIDTH = 900;
const FALLBACK_HEIGHT = 900;

const sketch: Sketch<SketchProps> = (p: P5CanvasInstance<SketchProps>) => {
  let onHover: ((node: StarNode | null) => void) | null = null;
  let payload: InstagramAnalysisPayload | null = null;
  let cw = FALLBACK_WIDTH;
  let ch = FALLBACK_HEIGHT;

  let sceneConfig: SceneConfig | null = null;
  let phase = 1;
  let phaseTick = 0;
  let hoveredNode: StarNode | null = null;

  p.setup = () => {
    p.createCanvas(cw, ch);
    p.frameRate(30);
    if (p.canvas) {
      p.canvas.addEventListener("mouseleave", () => {
        if (hoveredNode !== null) {
          hoveredNode = null;
          if (onHover) onHover(null);
          p.loop();
        }
      });
    }
  };

  p.updateWithProps = (props: SketchProps) => {
    onHover = props.onHover || null;
    payload = props.payload;
    cw = props.width || FALLBACK_WIDTH;
    ch = props.height || FALLBACK_HEIGHT;
    p.resizeCanvas(cw, ch);

    if (payload) {
      sceneConfig = buildSceneConfig(p, payload, cw, ch);
      phase = 1;
      phaseTick = 0;
      hoveredNode = null;
      if (onHover) onHover(null);
      p.loop();
    }
  };

  p.draw = () => {
    if (!payload || !sceneConfig) return;
    drawScene(p, payload, sceneConfig, phase, phaseTick, cw, ch);

    phaseTick += 1;
    if (phaseTick > 24 && phase < 5) {
      phase += 1;
      phaseTick = 0;
    }

    if (phase >= 5 && !hoveredNode) {
      p.noLoop();
    }
  };

  p.mouseMoved = () => {
    if (phase < 5 || !sceneConfig) return;
    let found: StarNode | null = null;
    for (const star of sceneConfig.stars) {
      const d = p.dist(p.mouseX, p.mouseY, star.x, star.y);
      if (d < star.radius + 15) {
        found = star;
        break;
      }
    }

    if (found !== hoveredNode) {
      hoveredNode = found;
      if (onHover) onHover(hoveredNode);
      p.loop();
    }
  };
};

export default function DigitalExposureArtwork({ data, width = FALLBACK_WIDTH, height = FALLBACK_HEIGHT }: DigitalExposureArtworkProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const payload = useMemo(() => data, [data]);
  const handleExport = useArtworkExport(containerRef, data.username || "profile");
  const [hoveredStar, setHoveredStar] = useState<StarNode | null>(null);

  const handleHover = useCallback((node: StarNode | null) => {
    setHoveredStar(node);
  }, []);

  return (
    <section className="glass-panel p-4 md:p-6 transition-all duration-300 shadow-2xl border border-white/10 hover:border-white/15 bg-slate-950/40">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="panel-title text-sm tracking-[0.16em]">EXHIBICIÓN DE CONSTELACIÓN CELSTE DE EXPOSICIÓN DIGITAL</p>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Una interpretación artística de las huellas de datos del perfil @{data.username}
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="relative overflow-hidden rounded-lg border border-amber-300/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-4 py-2 text-xs font-semibold text-amber-200 shadow-lg shadow-amber-950/20 backdrop-blur transition-all duration-300 hover:border-amber-300/50 hover:from-amber-500/20 hover:to-orange-500/20 hover:text-white hover:shadow-amber-500/10 hover:scale-[1.02] active:scale-[0.98]"
        >
          <span className="flex items-center justify-center gap-1.5 font-mono">
            <svg className="h-3.5 w-3.5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            EXPORTAR OBRA (PNG)
          </span>
        </button>
      </div>

      <div className="flex gap-4 items-start">
        <div ref={containerRef} className="overflow-hidden rounded-xl border border-white/10 bg-[#030408] flex-shrink-0 shadow-inner">
          <ReactP5Wrapper sketch={sketch} payload={payload} width={width} height={height} onHover={handleHover} />
        </div>
        <HoverInfoPanel star={hoveredStar} />
      </div>

      {/* Panel de Equivalencias Estelares */}
      <div className="mt-6 border-t border-white/10 pt-6">
        <p className="text-xs uppercase font-semibold tracking-[0.16em] text-amber-200 mb-4 font-mono flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          SISTEMA DE EQUIVALENCIAS Y CARTOGRAFÍA CELESTE
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-[11px] text-slate-300">
          {/* Columna 1: Cuerpos celestes */}
          <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 space-y-3 shadow-inner">
            <p className="text-amber-100 font-bold uppercase tracking-[0.08em] border-b border-white/5 pb-1">
              🔭 CUERPOS CELESTES (POSTS)
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-200 shadow-[0_0_8px_rgba(251,191,36,0.6)] mt-0.5" />
                <div>
                  <strong className="text-white block font-medium">Estrella de Plasma (Glow Star)</strong>
                  <span className="text-slate-400 text-[10px]">Núcleo hiper-brillante con aureolas térmicas. Representa posts con distribución balanceada de interacciones.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="relative flex-shrink-0 w-3 h-3 rounded-full bg-orange-500 border border-amber-300 mt-0.5 overflow-hidden">
                  <span className="absolute inset-x-0 top-1.5 h-0.5 bg-amber-200 opacity-60" />
                </span>
                <div>
                  <strong className="text-white block font-medium">Gigante Gaseoso (Gas Giant)</strong>
                  <span className="text-slate-400 text-[10px]">Esfera con bandas de viento paralelas (tipo Júpiter). Representa posts de alcance rápido e impulsivo.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="relative flex-shrink-0 w-3 h-3 rounded-full bg-blue-500 mt-0.5">
                  <span className="absolute -inset-1 border border-blue-300/40 rounded-full scale-[1.3] rotate-12" />
                </span>
                <div>
                  <strong className="text-white block font-medium">Planeta Anillado (Ringed)</strong>
                  <span className="text-slate-400 text-[10px]">Cuerpo estelar rodeado por un cinturón de asteroides (tipo Saturno). Representa posts con menciones activas de la red.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-3 h-3 rounded-full bg-red-600 border border-red-400 mt-0.5 relative">
                  <span className="absolute top-0.5 left-0.5 w-1 h-1 bg-black/40 rounded-full" />
                  <span className="absolute bottom-0.5 right-0.5 w-0.5 h-0.5 bg-black/40 rounded-full" />
                </span>
                <div>
                  <strong className="text-white block font-medium">Cuerpo Rocoso (Rocky Planet)</strong>
                  <span className="text-slate-400 text-[10px]">Esferas sólidas con texturas de cráteres (tipo Marte/Mercurio). Representa posts de contenido orgánico y directo.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna 2: Codificación de colores */}
          <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 space-y-3 shadow-inner">
            <p className="text-amber-100 font-bold uppercase tracking-[0.08em] border-b border-white/5 pb-1">
              🎨 CÓDICES CROMÁTICOS (HASHTAGS)
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-3 h-3 rounded-full bg-[#d75032] shadow-[0_0_6px_rgba(215,80,50,0.5)] mt-0.5" />
                <div>
                  <strong className="text-[#fca48c] block font-medium">Rojo Óxido (Mars Rust)</strong>
                  <span className="text-slate-400 text-[10px]">Posts y hashtags de temáticas intensas, virales, gastronómicas o de diseño artístico.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-3 h-3 rounded-full bg-[#f2b45c] shadow-[0_0_6px_rgba(242,180,92,0.5)] mt-0.5" />
                <div>
                  <strong className="text-[#fce4bd] block font-medium">Oro Joviano (Amber Gold)</strong>
                  <span className="text-slate-400 text-[10px]">Hashtags asociados a estilo de vida, marca personal o gastronomía gourmet.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-3 h-3 rounded-full bg-[#4b7de6] shadow-[0_0_6px_rgba(75,125,230,0.5)] mt-0.5" />
                <div>
                  <strong className="text-[#a4c2fc] block font-medium">Cobalto Profundo (Neptuno)</strong>
                  <span className="text-slate-400 text-[10px]">Contenido enfocado en tecnología, desarrollo profesional, ciencia o viajes de larga distancia.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-3 h-3 rounded-full bg-[#6edccb] shadow-[0_0_6px_rgba(110,220,205,0.5)] mt-0.5" />
                <div>
                  <strong className="text-[#bdfce8] block font-medium">Menta Aquamarina (Urano)</strong>
                  <span className="text-slate-400 text-[10px]">Estructuras de posts enfocados en medio ambiente, crecimiento orgánico, naturaleza y sostenibilidad.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-3 h-3 rounded-full bg-[#dc6e8c] shadow-[0_0_6px_rgba(220,110,140,0.5)] mt-0.5" />
                <div>
                  <strong className="text-[#fcbdf5] block font-medium">Bronce Rosado (Venus)</strong>
                  <span className="text-slate-400 text-[10px]">Interacciones personales, moda, arte estético, reflexiones y narrativas humanas.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna 3: Métricas estelares */}
          <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 space-y-3 shadow-inner">
            <p className="text-amber-100 font-bold uppercase tracking-[0.08em] border-b border-white/5 pb-1">
              📊 CARTOGRAFÍA DE MÉTRICAS (MAPPING)
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-[12px] mt-0.5">🪐</span>
                <div>
                  <strong className="text-white block font-medium">Masa Planetaria y Órbita (Likes)</strong>
                  <span className="text-slate-400 text-[10px]">El tamaño del planeta representa la fuerza gravitacional del post (su total de Likes). Además, la cantidad exacta se inscribe directamente barriendo una órbita circular concéntrica al cuerpo (como un cuadrante astronómico).</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[12px] mt-0.5">🌟</span>
                <div>
                  <strong className="text-white block font-medium">Resplandor y Halos (Comments)</strong>
                  <span className="text-slate-400 text-[10px]">El halo gaseoso externo representa la resonancia de comentarios sobre el post analizado.</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[12px] mt-0.5">🛰️</span>
                <div>
                  <strong className="text-white block font-medium">Lunas y Satélites (Mentions)</strong>
                  <span className="text-slate-400 text-[10px]">Pequeños planetoides orbitando alrededor del cuerpo representan menciones a otras cuentas.</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[12px] mt-0.5">🎇</span>
                <div>
                  <strong className="text-white block font-medium">Supernova (Top Likes)</strong>
                  <span className="text-slate-400 text-[10px]">Un gigantesco destello estelar de 8 puntas corona a la estrella de mayor tracción de Likes.</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[12px] mt-0.5">🌌</span>
                <div>
                  <strong className="text-white block font-medium">Nébula (Avg Engagement)</strong>
                  <span className="text-slate-400 text-[10px]">La densidad multicolor de polvo estelar de fondo representa la energía total del perfil analizado.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
