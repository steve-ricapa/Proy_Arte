import { useEffect, useState } from "react";
import axios from "axios";

import DigitalExposureArtwork from "../components/artwork/DigitalExposureArtwork";
import InputForm from "../components/forms/InputForm";
import useArtworkAudio from "../components/artwork/audio/useArtworkAudio";
import { createSamplePayload } from "../samplePayload";

const API_BASE = import.meta.env.VITE_API_BASE || "";
const PENDING_ANALYZE_STORAGE_KEY = "pending-analyze-request";

const savePendingAnalyzeRequest = (request) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PENDING_ANALYZE_STORAGE_KEY, JSON.stringify(request));
};

const readPendingAnalyzeRequest = () => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PENDING_ANALYZE_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const clearPendingAnalyzeRequest = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PENDING_ANALYZE_STORAGE_KEY);
};

export default function ExperiencePage({ onBack }) {
  const { armAudio, playBirthSound, playExplosionSound, isMuted, toggleMute } = useArtworkAudio();
  const [status, setStatus] = useState("listo");
  const [message, setMessage] = useState("Ingresa un username para crear una obra generativa.");
  const [payload, setPayload] = useState(null);
  const [extractorStatus, setExtractorStatus] = useState(null);
  const [pendingAnalyzeRequest, setPendingAnalyzeRequest] = useState(() => readPendingAnalyzeRequest());

  const refreshExtractorStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE}/extractor-status`);
      setExtractorStatus(response.data);
    } catch {
      setExtractorStatus(null);
    }
  };

  useEffect(() => {
    refreshExtractorStatus();
  }, []);

  useEffect(() => {
    if (!pendingAnalyzeRequest || status === "cargando") return;
    const ageMs = Date.now() - Number(pendingAnalyzeRequest.startedAt || 0);
    if (ageMs > 1000 * 60 * 5) {
      clearPendingAnalyzeRequest();
      setPendingAnalyzeRequest(null);
      return;
    }

    handleAnalyze(pendingAnalyzeRequest.username, pendingAnalyzeRequest.limit, { isResume: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnalyze = async (username, limit, options = {}) => {
    const normalizedLimit = Math.max(1, Math.min(100, Number(limit) || 50));
    const fingerprint = `${username}:${normalizedLimit}`;
    if (status === "cargando" && pendingAnalyzeRequest?.fingerprint === fingerprint) {
      console.info("[analyze] duplicate request skipped", { username, limit: normalizedLimit, reason: "same-fingerprint-loading" });
      return;
    }

    armAudio();
    setStatus("cargando");
    setMessage(options.isResume ? "Reanudando analisis pendiente..." : "Recolectando huellas digitales del perfil...");
    setPayload(null);
    const startedAt = performance.now();
    const pendingRequest = {
      username,
      limit: normalizedLimit,
      fingerprint,
      startedAt: Date.now(),
    };
    setPendingAnalyzeRequest(pendingRequest);
    savePendingAnalyzeRequest(pendingRequest);

    console.info("[analyze] request start", { username, limit: normalizedLimit, resumed: Boolean(options.isResume) });

    try {
      const response = await axios.post(`${API_BASE}/analyze-profile`, { username, limit: normalizedLimit });
      console.info("[analyze] request success", {
        username,
        limit: normalizedLimit,
        status: response.status,
        durationMs: Math.round(performance.now() - startedAt),
        posts: response.data?.posts?.length ?? 0,
      });
      clearPendingAnalyzeRequest();
      setPendingAnalyzeRequest(null);
      setPayload(response.data);
      setStatus("terminado");
      setMessage("Payload completo recibido. La constelacion ya puede dibujarse.");
    } catch (error) {
      console.error("[analyze] request error", {
        username,
        limit: normalizedLimit,
        status: error?.response?.status,
        durationMs: Math.round(performance.now() - startedAt),
        message: error?.message,
        detail: error?.response?.data,
      });
      clearPendingAnalyzeRequest();
      setPendingAnalyzeRequest(null);
      setStatus("error");
      setMessage(error?.response?.data?.detail || error?.message || "No se pudo analizar el perfil.");
      await refreshExtractorStatus();
    }
  };

  const extractorAuth = extractorStatus?.auth || null;
  const extractorReady = extractorAuth?.status === "configured";
  const helperMessage = extractorReady
    ? "Ingresa solo el username de Instagram (ejemplo: natgeo)."
    : "Extractor no configurado. Revisa APIFY_TOKEN en backend/.env.";

  const handleToggleMute = () => {
    armAudio();
    toggleMute();
  };

  return (
    <div
      className="relative min-h-screen"
      style={{
        backgroundImage: "url('/fondo-app.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Dark overlay so UI remains readable */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />

      {/* All content on top of the overlay */}
      <main className="relative z-10 mx-auto w-[min(1180px,94vw)] py-8 md:py-10">
        <header className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-black/60 px-5 py-7 shadow-2xl backdrop-blur-md md:px-8">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-purple-500/10 blur-2xl" />
          <div className="absolute -bottom-14 left-1/3 h-36 w-36 rounded-full bg-indigo-500/10 blur-2xl" />
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-purple-400">Instalación Generativa Interactiva</p>
              <h1 className="mt-2 text-3xl font-extrabold leading-tight text-white md:text-5xl">
                The Obligation to Shine
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-300 md:text-base">{message}</p>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="btn-cosmic shrink-0 self-start"
            >
              ← Volver
            </button>
          </div>
        </header>

        <InputForm onSubmit={handleAnalyze} disabled={status === "cargando" || !extractorReady} helperMessage={helperMessage} />

        {/* Loading / Status Visualization */}
        {status === "cargando" && (
          <div className="mt-6 glass-panel p-6 border border-purple-500/20 bg-slate-950/40 relative overflow-hidden animate-pulse">
            <div className="flex items-center justify-between mb-3 font-mono text-xs text-purple-300">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 bg-purple-500 rounded-full animate-ping" />
                CONECTANDO CON LA CONSTELACIÓN DIGITAL...
              </span>
              <span>CARGANDO HUELLAS</span>
            </div>
            <div className="h-1.5 w-full bg-purple-950/60 rounded-full overflow-hidden border border-purple-500/10">
              <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style={{ width: "65%", animation: "shimmer 1.5s infinite" }} />
            </div>
            <p className="mt-3 font-mono text-[10px] text-slate-400">
              [EXTRACTOR_PROC: INICIANDO BÚSQUEDA DE NODOS Y RELACIONES EN EL ESPACIO SOCIAL]
            </p>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              clearPendingAnalyzeRequest();
              setPendingAnalyzeRequest(null);
              armAudio();
              setPayload(createSamplePayload());
              setStatus("terminado");
              setMessage("Payload de prueba cargado localmente.");
            }}
            className="group relative overflow-hidden rounded-xl border border-purple-500/20 bg-purple-950/20 px-4 py-2.5 text-xs font-mono font-semibold text-purple-300 transition-all duration-300 hover:bg-purple-900/30 hover:border-purple-500/40 hover:text-white"
          >
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 group-hover:bg-purple-300" />
              [ CARGAR_MODO_DEMO : SIMULAR_DATOS ]
            </span>
          </button>
          
          <div className="font-mono text-[10px] text-slate-500">
            ESTADO EXTRACTOR: <span className={extractorReady ? "text-emerald-400" : "text-rose-400"}>
              {extractorReady ? "CONECTADO" : "SIN CONFIGURAR"}
            </span>
          </div>
        </div>

        {payload && (
          <div className="mt-8">
            <DigitalExposureArtwork
              data={payload}
              onPlanetBorn={playBirthSound}
              onPlanetExploded={playExplosionSound}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
            />
          </div>
        )}
      </main>
    </div>
  );
}
