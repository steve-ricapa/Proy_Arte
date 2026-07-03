import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ReactP5Wrapper, Sketch, P5CanvasInstance } from "@p5-wrapper/react";

import HoverInfoPanel from "./HoverInfoPanel";
import TimelineControls from "./timeline/TimelineControls";
import { useArtworkExport } from "./hooks/useArtworkExport";
import { buildSceneConfig } from "./scene/buildSceneConfig";
import { drawScene } from "./render/drawScene";
import { getNodeTimelineState, getStarPositionAtTime, isNodeVisibleAtTime } from "./timeline/temporal";
import { InstagramAnalysisPayload, SceneConfig, StarNode } from "./types/artwork.types";

type DigitalExposureArtworkProps = {
  data: InstagramAnalysisPayload;
  width?: number;
  height?: number;
  onPlanetBorn?: () => void;
  onPlanetExploded?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
};

type SketchProps = {
  payload: InstagramAnalysisPayload;
  width: number;
  height: number;
  onHover: (node: StarNode | null) => void;
  onIntroReady: () => void;
  onSceneReady: (scene: SceneConfig) => void;
  currentTimestamp: number;
  isFullscreen: boolean;
  isScrubbing: boolean;
  onPlanetBorn?: () => void;
  onPlanetExploded?: () => void;
};

type TimelineMeta = {
  oldestPostMs: number;
  newestPostMs: number;
  timelineStartMs: number;
  timelineEndMs: number;
};

const ASPECT_RATIO = 16 / 9;
const FALLBACK_WIDTH = 1280;
const FALLBACK_HEIGHT = 720;
const TIMELINE_DURATION_MS = 36000;

const formatTimelineDate = (timestamp: number) => {
  if (!timestamp || Number.isNaN(timestamp)) return "No date";
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getInitialTimelineProgress = (timelineMeta: TimelineMeta | null) => {
  if (!timelineMeta) return 0;
  const total = Math.max(1, timelineMeta.timelineEndMs - timelineMeta.timelineStartMs);
  const firstPostProgress = (timelineMeta.oldestPostMs - timelineMeta.timelineStartMs) / total;
  return Math.min(1, Math.max(0, firstPostProgress + 0.015));
};

const sketch: Sketch<SketchProps> = (p: P5CanvasInstance<SketchProps>) => {
  let onHover: ((node: StarNode | null) => void) | null = null;
  let onIntroReady: (() => void) | null = null;
  let onSceneReady: ((scene: SceneConfig) => void) | null = null;
  let payload: InstagramAnalysisPayload | null = null;
  let currentTimestamp = 0;
  let isFullscreen = false;
  let isScrubbing = false;
  let cw = FALLBACK_WIDTH;
  let ch = FALLBACK_HEIGHT;

  let sceneConfig: SceneConfig | null = null;
  let phase = 1;
  let phaseTick = 0;
  let hoveredNode: StarNode | null = null;
  let introAnnounced = false;
  let onPlanetBorn: (() => void) | undefined;
  let onPlanetExploded: (() => void) | undefined;
  let bornSoundPlayedIds = new Set<string>();
  let explodedSoundPlayedIds = new Set<string>();
  let lastTimelineTimestamp = 0;
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let panStartMouseX = 0;
  let panStartMouseY = 0;
  let panOriginX = 0;
  let panOriginY = 0;

  const screenToWorld = (screenX: number, screenY: number) => ({
    x: (screenX - panX) / zoom,
    y: (screenY - panY) / zoom,
  });

  const clampPan = () => {
    if (zoom <= 1) {
      panX = 0;
      panY = 0;
      return;
    }

    const scaledW = cw * zoom;
    const scaledH = ch * zoom;
    const minPanX = cw - scaledW;
    const minPanY = ch - scaledH;
    panX = Math.min(0, Math.max(minPanX, panX));
    panY = Math.min(0, Math.max(minPanY, panY));
  };

  const resetView = () => {
    zoom = 1;
    panX = 0;
    panY = 0;
    isPanning = false;
  };

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
    onPlanetBorn = props.onPlanetBorn;
    onPlanetExploded = props.onPlanetExploded;
    currentTimestamp = props.currentTimestamp;
    isFullscreen = props.isFullscreen;
    isScrubbing = props.isScrubbing;
    cw = nextWidth;
    ch = nextHeight;

    if (sizeChanged) {
      p.resizeCanvas(cw, ch);
      clampPan();
    }

    if (!isFullscreen) {
      resetView();
    }

    if (payloadChanged || sizeChanged || !sceneConfig) {
      payload = props.payload;
      sceneConfig = buildSceneConfig(p, payload, cw, ch);
      if (onSceneReady) onSceneReady(sceneConfig);
      phase = 1;
      phaseTick = 0;
      hoveredNode = null;
      introAnnounced = false;
      bornSoundPlayedIds = new Set<string>();
      explodedSoundPlayedIds = new Set<string>();
      lastTimelineTimestamp = 0;
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
      drawScene(p, sceneConfig, phase, phaseTick, cw, ch, sceneConfig.timelineStartMs, { zoom, panX, panY });
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

    if (currentTimestamp < lastTimelineTimestamp) {
      bornSoundPlayedIds.clear();
      explodedSoundPlayedIds.clear();
    }

    sceneConfig.stars.forEach((star) => {
      const timeline = getNodeTimelineState(star, sceneConfig, currentTimestamp);
      if (timeline.isVisible && timeline.appearance > 0 && !bornSoundPlayedIds.has(star.id)) {
        bornSoundPlayedIds.add(star.id);
        onPlanetBorn?.();
      }
      if (timeline.isDead && !explodedSoundPlayedIds.has(star.id)) {
        explodedSoundPlayedIds.add(star.id);
        onPlanetExploded?.();
      }
    });
    lastTimelineTimestamp = currentTimestamp;

    drawScene(p, sceneConfig, phase, phaseTick, cw, ch, currentTimestamp, { zoom, panX, panY });

    const anyScene = sceneConfig as any;
    const hasExplosions = anyScene.explosions && anyScene.explosions.length > 0;
    if (!hoveredNode && !hasExplosions) {
      p.noLoop();
    }
  };

  p.mouseMoved = () => {
    if (phase < 5 || !sceneConfig || isScrubbing) return;
    if (isPanning) return;
    const point = screenToWorld(p.mouseX, p.mouseY);
    let found: StarNode | null = null;
    for (const star of sceneConfig.stars) {
      if (!isNodeVisibleAtTime(star, sceneConfig, currentTimestamp)) continue;
      const position = getStarPositionAtTime(star, sceneConfig, currentTimestamp);
      const d = p.dist(point.x, point.y, position.x, position.y);
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

  p.mousePressed = () => {
    if (!isFullscreen || phase < 5 || isScrubbing || p.mouseButton !== p.LEFT) return;
    isPanning = true;
    panStartMouseX = p.mouseX;
    panStartMouseY = p.mouseY;
    panOriginX = panX;
    panOriginY = panY;
  };

  p.mouseDragged = () => {
    if (!isPanning || !isFullscreen || isScrubbing) return;
    panX = panOriginX + (p.mouseX - panStartMouseX);
    panY = panOriginY + (p.mouseY - panStartMouseY);
    clampPan();
    if (hoveredNode !== null) {
      hoveredNode = null;
      if (onHover) onHover(null);
    }
    p.loop();
  };

  p.mouseReleased = () => {
    isPanning = false;
  };

  p.doubleClicked = () => {
    if (!isFullscreen) return;
    resetView();
    p.loop();
  };

  p.mouseWheel = (event) => {
    if (!isFullscreen || phase < 5 || isScrubbing) return undefined;
    const zoomFactor = event.delta > 0 ? 0.92 : 1.08;
    const nextZoom = Math.min(3, Math.max(1, zoom * zoomFactor));
    if (nextZoom === zoom) return false;

    const worldBefore = screenToWorld(p.mouseX, p.mouseY);
    zoom = nextZoom;
    panX = p.mouseX - worldBefore.x * zoom;
    panY = p.mouseY - worldBefore.y * zoom;
    clampPan();
    p.loop();
    return false;
  };
};

export default function DigitalExposureArtwork({
  data,
  width = FALLBACK_WIDTH,
  height = FALLBACK_HEIGHT,
  onPlanetBorn,
  onPlanetExploded,
  isMuted = false,
  onToggleMute,
}: DigitalExposureArtworkProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasFrameRef = useRef<HTMLDivElement>(null);
  const payload = useMemo(() => data, [data]);
  const handleExport = useArtworkExport(canvasFrameRef, data.username || "profile");
  const [hoveredStar, setHoveredStar] = useState<StarNode | null>(null);
  const [timelineProgress, setTimelineProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTimelineReady, setIsTimelineReady] = useState(false);
  const [timelineMeta, setTimelineMeta] = useState<TimelineMeta | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [resumeAfterScrub, setResumeAfterScrub] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width, height });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentTimestamp = useMemo(() => {
    if (!timelineMeta) return 0;
    return timelineMeta.timelineStartMs + (timelineMeta.timelineEndMs - timelineMeta.timelineStartMs) * timelineProgress;
  }, [timelineMeta, timelineProgress]);

  useEffect(() => {
    setHoveredStar(null);
    setTimelineProgress(0);
    setPlaybackSpeed(1);
    setIsPlaying(false);
    setIsTimelineReady(false);
    setTimelineMeta(null);
    setIsScrubbing(false);
    setResumeAfterScrub(false);
  }, [data]);

  useEffect(() => {
    const measureCanvas = () => {
      const stageEl = stageRef.current;
      const el = canvasFrameRef.current;
      if (!el) return;

      let nextWidth = stageEl?.clientWidth || el.clientWidth || width;
      let nextHeight = Math.round(nextWidth / ASPECT_RATIO);

      if (stageEl && document.fullscreenElement === stageEl) {
        const stageWidth = Math.max(480, stageEl.clientWidth - 48);
        const stageHeight = Math.max(320, stageEl.clientHeight - 140);
        if (stageWidth / stageHeight > ASPECT_RATIO) {
          nextHeight = stageHeight;
          nextWidth = Math.round(nextHeight * ASPECT_RATIO);
        } else {
          nextWidth = stageWidth;
          nextHeight = Math.round(stageWidth / ASPECT_RATIO);
        }
      }

      setCanvasSize((prev) => {
        if (prev.width === nextWidth && prev.height === nextHeight) return prev;
        return { width: nextWidth, height: nextHeight };
      });
    };

    const observer = new ResizeObserver(() => measureCanvas());
    if (canvasFrameRef.current) {
      observer.observe(canvasFrameRef.current);
    }
    if (stageRef.current) {
      observer.observe(stageRef.current);
    }

    window.addEventListener("resize", measureCanvas);
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === stageRef.current);
      measureCanvas();
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    measureCanvas();

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measureCanvas);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [width]);

  useEffect(() => {
    if (!isPlaying || !isTimelineReady || isScrubbing) return;

    let frameId = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const delta = now - last;
      last = now;
      setTimelineProgress((prev) => {
        const next = Math.min(1, prev + (delta * playbackSpeed) / TIMELINE_DURATION_MS);
        if (next >= 1) {
          setIsPlaying(false);
        }
        return next;
      });
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, isTimelineReady, isScrubbing, playbackSpeed]);

  useEffect(() => {
    if (hoveredStar) {
      setIsPlaying(false);
    }
  }, [hoveredStar]);

  useEffect(() => {
    if (!timelineMeta || !isTimelineReady || timelineProgress > 0) return;
    setTimelineProgress(getInitialTimelineProgress(timelineMeta));
  }, [timelineMeta, isTimelineReady, timelineProgress]);

  const handleHover = useCallback((node: StarNode | null) => {
    setHoveredStar(node);
  }, []);

  const handleIntroReady = useCallback(() => {
    setIsTimelineReady(true);
    setTimelineProgress((prev) => {
      if (prev > 0) return prev;
      return getInitialTimelineProgress(timelineMeta);
    });
    setIsPlaying(true);
  }, [timelineMeta]);

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
  }, []);

  const handleSpeedChange = useCallback((value: number) => {
    setPlaybackSpeed(value);
  }, []);

  const handleScrubStart = useCallback(() => {
    setResumeAfterScrub(isPlaying);
    setIsPlaying(false);
    setIsScrubbing(true);
  }, [isPlaying]);

  const handleScrubEnd = useCallback(() => {
    setIsScrubbing(false);
    if (resumeAfterScrub && timelineProgress < 1) {
      setIsPlaying(true);
    }
    setResumeAfterScrub(false);
  }, [resumeAfterScrub, timelineProgress]);

  const handleResetTimeline = useCallback(() => {
    setTimelineProgress(getInitialTimelineProgress(timelineMeta));
    setHoveredStar(null);
    setIsPlaying(false);
    setIsScrubbing(false);
    setResumeAfterScrub(false);
  }, [timelineMeta]);

  const handleTogglePlay = useCallback(() => {
    if (!isTimelineReady) return;
    setIsPlaying((prev) => {
      if (timelineProgress >= 1) {
        setTimelineProgress(getInitialTimelineProgress(timelineMeta));
        return true;
      }
      return !prev;
    });
  }, [isTimelineReady, timelineMeta, timelineProgress]);

  const handleFullscreen = () => {
    const element = stageRef.current;
    if (!element) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }
    element.requestFullscreen().catch((err) => {
      console.error("Error attempting to enable fullscreen:", err);
    });
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
            onClick={onToggleMute}
            className="relative overflow-hidden rounded-lg border border-purple-500/30 bg-black/35 px-4 py-2 text-xs font-semibold text-purple-200 shadow-lg shadow-purple-950/20 backdrop-blur transition-all duration-300 hover:border-purple-500/50 hover:bg-purple-900/30 hover:text-white hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-1.5 font-mono">
              <svg className="h-3.5 w-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                {isMuted ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 9l4 4m0 0l-4 4m4-4H9m4-8L5 9H3v6h2l8 4V5z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H3v6h3l5 4V5zm5.54 3.46a5 5 0 010 7.08m2.83-9.91a9 9 0 010 12.74" />
                )}
              </svg>
              {isMuted ? "SONIDO OFF" : "SONIDO ON"}
            </span>
          </button>

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

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1">
          <div ref={stageRef} className={`fullscreen-stage ${isFullscreen ? "is-fullscreen" : ""}`}>
          <div
            ref={canvasFrameRef}
            className="fullscreen-canvas-wrapper aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-[#030408] shadow-inner"
            style={isFullscreen ? { width: `${canvasSize.width}px`, height: `${canvasSize.height}px`, maxWidth: "100%" } : undefined}
          >
            <ReactP5Wrapper
              sketch={sketch}
              payload={payload}
              width={canvasSize.width}
              height={canvasSize.height}
              onHover={handleHover}
              onIntroReady={handleIntroReady}
              onSceneReady={handleSceneReady}
              currentTimestamp={currentTimestamp}
              isFullscreen={isFullscreen}
              isScrubbing={isScrubbing}
              onPlanetBorn={onPlanetBorn}
              onPlanetExploded={onPlanetExploded}
            />
          </div>

          {isFullscreen ? (
            <div className="fullscreen-stage__controls">
              <TimelineControls
                progress={timelineProgress}
                onProgressChange={handleTimelineChange}
                speed={playbackSpeed}
                onSpeedChange={handleSpeedChange}
                onScrubStart={handleScrubStart}
                onScrubEnd={handleScrubEnd}
                isPlaying={isPlaying}
                onTogglePlay={handleTogglePlay}
                onReset={handleResetTimeline}
                currentLabel={formatTimelineDate(currentTimestamp)}
                startLabel={formatTimelineDate(timelineMeta?.oldestPostMs || 0)}
                endLabel={formatTimelineDate(timelineMeta?.newestPostMs || 0)}
                disabled={!isTimelineReady || !timelineMeta}
                className="mt-0 border-white/15 bg-black/65 backdrop-blur-md"
              />
            </div>
          ) : null}
          </div>

          {!isFullscreen ? (
            <TimelineControls
              progress={timelineProgress}
              onProgressChange={handleTimelineChange}
              speed={playbackSpeed}
              onSpeedChange={handleSpeedChange}
              onScrubStart={handleScrubStart}
              onScrubEnd={handleScrubEnd}
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              onReset={handleResetTimeline}
              currentLabel={formatTimelineDate(currentTimestamp)}
              startLabel={formatTimelineDate(timelineMeta?.oldestPostMs || 0)}
              endLabel={formatTimelineDate(timelineMeta?.newestPostMs || 0)}
              disabled={!isTimelineReady || !timelineMeta}
            />
          ) : null}
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
            <p className="text-purple-200 font-bold uppercase tracking-[0.08em] border-b border-white/5 pb-1">CUERPOS CELESTES (POSTS)</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2.5"><span className="relative flex-shrink-0 w-3 h-3 rounded-full bg-purple-600 border border-purple-400 mt-0.5 overflow-hidden"><span className="absolute inset-x-0 top-1.5 h-0.5 bg-purple-200 opacity-60" /></span><div><strong className="text-white block font-medium">Gigante Gaseoso</strong><span className="text-slate-400 text-[10px]">Posts de alcance rapido y traccion impulsiva.</span></div></div>
              <div className="flex items-start gap-2.5"><span className="relative flex-shrink-0 w-3 h-3 rounded-full bg-blue-500 mt-0.5"><span className="absolute -inset-1 border border-blue-300/40 rounded-full scale-[1.3] rotate-12" /></span><div><strong className="text-white block font-medium">Planeta Anillado</strong><span className="text-slate-400 text-[10px]">Posts con menciones activas y resonancia social.</span></div></div>
              <div className="flex items-start gap-2.5"><span className="flex-shrink-0 w-3 h-3 rounded-full bg-indigo-600 border border-indigo-400 mt-0.5 relative"><span className="absolute top-0.5 left-0.5 w-1 h-1 bg-black/40 rounded-full" /><span className="absolute bottom-0.5 right-0.5 w-0.5 h-0.5 bg-black/40 rounded-full" /></span><div><strong className="text-white block font-medium">Cuerpo Rocoso</strong><span className="text-slate-400 text-[10px]">Posts directos, organicos y de materia visual mas densa.</span></div></div>
            </div>
          </div>

          <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 space-y-3 shadow-inner">
            <p className="text-purple-200 font-bold uppercase tracking-[0.08em] border-b border-white/5 pb-1">CODICES CROMATICOS (HASHTAGS)</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2.5"><span className="flex-shrink-0 w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.5)] mt-0.5" /><div><strong className="text-[#c7d2fe] block font-medium">Cobalto Profundo</strong><span className="text-slate-400 text-[10px]">Temas de tecnologia, profesion, ciencia o trayectorias de largo alcance.</span></div></div>
              <div className="flex items-start gap-2.5"><span className="flex-shrink-0 w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.5)] mt-0.5" /><div><strong className="text-[#e9d5ff] block font-medium">Violeta Estelar</strong><span className="text-slate-400 text-[10px]">Marca personal, arte digital y atmosferas de alta exposicion.</span></div></div>
              <div className="flex items-start gap-2.5"><span className="flex-shrink-0 w-3 h-3 rounded-full bg-fuchsia-500 shadow-[0_0_6px_rgba(217,70,239,0.5)] mt-0.5" /><div><strong className="text-[#f5d0fe] block font-medium">Bronce Rosado</strong><span className="text-slate-400 text-[10px]">Reflexiones personales, cercania afectiva y estetica relacional.</span></div></div>
            </div>
          </div>

          <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 space-y-3 shadow-inner">
            <p className="text-purple-200 font-bold uppercase tracking-[0.08em] border-b border-white/5 pb-1">CARTOGRAFIA DE METRICAS</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2"><span className="text-[12px] mt-0.5">M</span><div><strong className="text-white block font-medium">Masa Planetaria</strong><span className="text-slate-400 text-[10px]">El radio del planeta representa la fuerza gravitacional del post en likes.</span></div></div>
              <div className="flex items-start gap-2"><span className="text-[12px] mt-0.5">A</span><div><strong className="text-white block font-medium">Aura y Halos</strong><span className="text-slate-400 text-[10px]">La intensidad exterior traduce el volumen de comentarios.</span></div></div>
              <div className="flex items-start gap-2"><span className="text-[12px] mt-0.5">S</span><div><strong className="text-white block font-medium">Satelites</strong><span className="text-slate-400 text-[10px]">Las menciones orbitan como pequenos cuerpos asociados a cada publicacion.</span></div></div>
              <div className="flex items-start gap-2"><span className="text-[12px] mt-0.5">T</span><div><strong className="text-white block font-medium">Tiempo</strong><span className="text-slate-400 text-[10px]">La timeline activa o apaga gradualmente la presencia de cada planeta segun su fecha.</span></div></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
