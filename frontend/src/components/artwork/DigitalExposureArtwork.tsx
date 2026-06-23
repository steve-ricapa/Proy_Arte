import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ReactP5Wrapper, Sketch, P5CanvasInstance } from "@p5-wrapper/react";

import HoverInfoPanel from "./HoverInfoPanel";
import TimelineControls from "./timeline/TimelineControls";
import { useArtworkExport } from "./hooks/useArtworkExport";
import { buildSceneConfig } from "./scene/buildSceneConfig";
import { drawScene } from "./render/drawScene";
import { isNodeVisibleAtTime } from "./timeline/temporal";
import { InstagramAnalysisPayload, SceneConfig, StarNode } from "./types/artwork.types";

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
  onIntroReady: () => void;
  onSceneReady: (scene: SceneConfig) => void;
  currentTimestamp: number;
};

type TimelineMeta = {
  oldestPostMs: number;
  newestPostMs: number;
  timelineStartMs: number;
  timelineEndMs: number;
};

const FALLBACK_WIDTH = 900;
const FALLBACK_HEIGHT = 900;
const TIMELINE_DURATION_MS = 18000;

const formatTimelineDate = (timestamp: number) => {
  if (!timestamp || Number.isNaN(timestamp)) return "No date";
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const sketch: Sketch<SketchProps> = (p: P5CanvasInstance<SketchProps>) => {
  let onHover: ((node: StarNode | null) => void) | null = null;
  let onIntroReady: (() => void) | null = null;
  let onSceneReady: ((scene: SceneConfig) => void) | null = null;
  let payload: InstagramAnalysisPayload | null = null;
  let currentTimestamp = 0;
  let cw = FALLBACK_WIDTH;
  let ch = FALLBACK_HEIGHT;

  let sceneConfig: SceneConfig | null = null;
  let phase = 1;
  let phaseTick = 0;
  let hoveredNode: StarNode | null = null;
  let introAnnounced = false;

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
    const nextWidth = props.width || FALLBACK_WIDTH;
    const nextHeight = props.height || FALLBACK_HEIGHT;
    const payloadChanged = payload !== props.payload;
    const sizeChanged = cw !== nextWidth || ch !== nextHeight;

    onHover = props.onHover || null;
    onIntroReady = props.onIntroReady || null;
    onSceneReady = props.onSceneReady || null;
    currentTimestamp = props.currentTimestamp;
    cw = nextWidth;
    ch = nextHeight;

    if (sizeChanged) {
      p.resizeCanvas(cw, ch);
    }

    if (payloadChanged || sizeChanged || !sceneConfig) {
      payload = props.payload;
      sceneConfig = buildSceneConfig(p, payload, cw, ch);
      if (onSceneReady) onSceneReady(sceneConfig);
      phase = 1;
      phaseTick = 0;
      hoveredNode = null;
      introAnnounced = false;
      if (onHover) onHover(null);
      p.loop();
      return;
    }

    payload = props.payload;

    if (sceneConfig && hoveredNode && !isNodeVisibleAtTime(hoveredNode, sceneConfig, currentTimestamp)) {
      hoveredNode = null;
      if (onHover) onHover(null);
    }

    p.loop();
  };

  p.draw = () => {
    if (!payload || !sceneConfig) return;

    if (phase < 5) {
      drawScene(p, sceneConfig, phase, phaseTick, cw, ch, sceneConfig.timelineStartMs);
      phaseTick += 1;
      if (phaseTick > 24 && phase < 5) {
        phase += 1;
        phaseTick = 0;
      }
      if (phase >= 5 && !introAnnounced) {
        introAnnounced = true;
        if (onIntroReady) onIntroReady();
      }
      return;
    }

    drawScene(p, sceneConfig, phase, phaseTick, cw, ch, currentTimestamp);

    if (!hoveredNode) {
      p.noLoop();
    }
  };

  p.mouseMoved = () => {
    if (phase < 5 || !sceneConfig) return;
    let found: StarNode | null = null;
    for (const star of sceneConfig.stars) {
      if (!isNodeVisibleAtTime(star, sceneConfig, currentTimestamp)) continue;
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
  const [timelineProgress, setTimelineProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTimelineReady, setIsTimelineReady] = useState(false);
  const [timelineMeta, setTimelineMeta] = useState<TimelineMeta | null>(null);

  const currentTimestamp = useMemo(() => {
    if (!timelineMeta) return 0;
    return timelineMeta.timelineStartMs + (timelineMeta.timelineEndMs - timelineMeta.timelineStartMs) * timelineProgress;
  }, [timelineMeta, timelineProgress]);

  useEffect(() => {
    setHoveredStar(null);
    setTimelineProgress(0);
    setIsPlaying(false);
    setIsTimelineReady(false);
    setTimelineMeta(null);
  }, [data]);

  useEffect(() => {
    if (!isPlaying || !isTimelineReady) return;

    let frameId = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const delta = now - last;
      last = now;
      setTimelineProgress((prev) => {
        const next = Math.min(1, prev + delta / TIMELINE_DURATION_MS);
        if (next >= 1) {
          setIsPlaying(false);
        }
        return next;
      });
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, isTimelineReady]);

  useEffect(() => {
    if (hoveredStar) {
      setIsPlaying(false);
    }
  }, [hoveredStar]);

  const handleHover = useCallback((node: StarNode | null) => {
    setHoveredStar(node);
  }, []);

  const handleIntroReady = useCallback(() => {
    setIsTimelineReady(true);
    setIsPlaying(true);
  }, []);

  const handleSceneReady = useCallback((scene: SceneConfig) => {
    setTimelineMeta({
      oldestPostMs: scene.oldestPostMs,
      newestPostMs: scene.newestPostMs,
      timelineStartMs: scene.timelineStartMs,
      timelineEndMs: scene.timelineEndMs,
    });
  }, []);

  const handleTimelineChange = useCallback((value: number) => {
    setTimelineProgress(value);
    setIsPlaying(false);
  }, []);

  const handleResetTimeline = useCallback(() => {
    setTimelineProgress(0);
    setHoveredStar(null);
    setIsPlaying(false);
  }, []);

  const handleTogglePlay = useCallback(() => {
    if (!isTimelineReady) return;
    setIsPlaying((prev) => {
      if (timelineProgress >= 1) {
        setTimelineProgress(0);
        return true;
      }
      return !prev;
    });
  }, [isTimelineReady, timelineProgress]);

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen().catch((err) => {
          console.error("Error attempting to enable fullscreen:", err);
        });
      }
    }
  };

  return (
    <section className="glass-panel p-4 md:p-6 transition-all duration-300 shadow-2xl border border-white/10 hover:border-white/15 bg-slate-950/40">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="panel-title text-sm tracking-[0.16em]">EXHIBICION DE CONSTELACION CELESTE DE EXPOSICION DIGITAL</p>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Una interpretacion artistica de las huellas de datos del perfil @{data.username}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleFullscreen}
            className="relative overflow-hidden rounded-lg border border-purple-500/30 bg-purple-950/40 px-4 py-2 text-xs font-semibold text-purple-200 shadow-lg shadow-purple-950/20 backdrop-blur transition-all duration-300 hover:border-purple-500/50 hover:bg-purple-900/40 hover:text-white hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-1.5 font-mono">
              <svg className="h-3.5 w-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m5.25 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />
              </svg>
              PANTALLA COMPLETA
            </span>
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="relative overflow-hidden rounded-lg border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 px-4 py-2 text-xs font-semibold text-purple-200 shadow-lg shadow-purple-950/20 backdrop-blur transition-all duration-300 hover:border-purple-500/50 hover:from-purple-500/20 hover:to-indigo-500/20 hover:text-white hover:shadow-purple-500/10 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-1.5 font-mono">
              <svg className="h-3.5 w-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              EXPORTAR OBRA (PNG)
            </span>
          </button>
        </div>
      </div>

      <div className="flex gap-4 items-start">
        <div className="min-w-0 flex-1">
          <div ref={containerRef} className="fullscreen-canvas-wrapper overflow-hidden rounded-xl border border-white/10 bg-[#030408] flex-shrink-0 shadow-inner">
            <ReactP5Wrapper
              sketch={sketch}
              payload={payload}
              width={width}
              height={height}
              onHover={handleHover}
              onIntroReady={handleIntroReady}
              onSceneReady={handleSceneReady}
              currentTimestamp={currentTimestamp}
            />
          </div>

          <TimelineControls
            progress={timelineProgress}
            onProgressChange={handleTimelineChange}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onReset={handleResetTimeline}
            currentLabel={formatTimelineDate(currentTimestamp)}
            startLabel={formatTimelineDate(timelineMeta?.oldestPostMs || 0)}
            endLabel={formatTimelineDate(timelineMeta?.newestPostMs || 0)}
            disabled={!isTimelineReady || !timelineMeta}
          />
        </div>

        <HoverInfoPanel star={hoveredStar} />
      </div>

      <div className="mt-6 border-t border-white/10 pt-6">
        <p className="text-xs uppercase font-semibold tracking-[0.16em] text-purple-300 mb-4 font-mono flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
          SISTEMA DE EQUIVALENCIAS Y CARTOGRAFIA CELESTE
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-[11px] text-slate-300">
          <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 space-y-3 shadow-inner">
            <p className="text-purple-200 font-bold uppercase tracking-[0.08em] border-b border-white/5 pb-1">
              CUERPOS CELESTES (POSTS)
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2.5">
                <span className="relative flex-shrink-0 w-3 h-3 rounded-full bg-purple-600 border border-purple-400 mt-0.5 overflow-hidden">
                  <span className="absolute inset-x-0 top-1.5 h-0.5 bg-purple-200 opacity-60" />
                </span>
                <div>
                  <strong className="text-white block font-medium">Gigante Gaseoso</strong>
                  <span className="text-slate-400 text-[10px]">Posts de alcance rapido y traccion impulsiva.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="relative flex-shrink-0 w-3 h-3 rounded-full bg-blue-500 mt-0.5">
                  <span className="absolute -inset-1 border border-blue-300/40 rounded-full scale-[1.3] rotate-12" />
                </span>
                <div>
                  <strong className="text-white block font-medium">Planeta Anillado</strong>
                  <span className="text-slate-400 text-[10px]">Posts con menciones activas y resonancia social.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-3 h-3 rounded-full bg-indigo-600 border border-indigo-400 mt-0.5 relative">
                  <span className="absolute top-0.5 left-0.5 w-1 h-1 bg-black/40 rounded-full" />
                  <span className="absolute bottom-0.5 right-0.5 w-0.5 h-0.5 bg-black/40 rounded-full" />
                </span>
                <div>
                  <strong className="text-white block font-medium">Cuerpo Rocoso</strong>
                  <span className="text-slate-400 text-[10px]">Posts directos, organicos y de materia visual mas densa.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 space-y-3 shadow-inner">
            <p className="text-purple-200 font-bold uppercase tracking-[0.08em] border-b border-white/5 pb-1">
              CODICES CROMATICOS (HASHTAGS)
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.5)] mt-0.5" />
                <div>
                  <strong className="text-[#c7d2fe] block font-medium">Cobalto Profundo</strong>
                  <span className="text-slate-400 text-[10px]">Temas de tecnologia, profesion, ciencia o trayectorias de largo alcance.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.5)] mt-0.5" />
                <div>
                  <strong className="text-[#e9d5ff] block font-medium">Violeta Estelar</strong>
                  <span className="text-slate-400 text-[10px]">Marca personal, arte digital y atmosferas de alta exposicion.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-3 h-3 rounded-full bg-fuchsia-500 shadow-[0_0_6px_rgba(217,70,239,0.5)] mt-0.5" />
                <div>
                  <strong className="text-[#f5d0fe] block font-medium">Bronce Rosado</strong>
                  <span className="text-slate-400 text-[10px]">Reflexiones personales, cercania afectiva y estetica relacional.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 space-y-3 shadow-inner">
            <p className="text-purple-200 font-bold uppercase tracking-[0.08em] border-b border-white/5 pb-1">
              CARTOGRAFIA DE METRICAS
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-[12px] mt-0.5">M</span>
                <div>
                  <strong className="text-white block font-medium">Masa Planetaria</strong>
                  <span className="text-slate-400 text-[10px]">El radio del planeta representa la fuerza gravitacional del post en likes.</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[12px] mt-0.5">A</span>
                <div>
                  <strong className="text-white block font-medium">Aura y Halos</strong>
                  <span className="text-slate-400 text-[10px]">La intensidad exterior traduce el volumen de comentarios.</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[12px] mt-0.5">S</span>
                <div>
                  <strong className="text-white block font-medium">Satelites</strong>
                  <span className="text-slate-400 text-[10px]">Las menciones orbitan como pequenos cuerpos asociados a cada publicacion.</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[12px] mt-0.5">T</span>
                <div>
                  <strong className="text-white block font-medium">Tiempo</strong>
                  <span className="text-slate-400 text-[10px]">La timeline activa o apaga gradualmente la presencia de cada planeta segun su fecha.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
