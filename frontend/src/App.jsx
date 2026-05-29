import { useEffect, useState } from "react";
import axios from "axios";
import InputForm from "./components/forms/InputForm";
import DigitalExposureArtwork from "./components/artwork/DigitalExposureArtwork";
import samplePayload from "./samplePayload";

const API_BASE = import.meta.env.VITE_API_BASE || "";

function App() {
  const [status, setStatus] = useState("listo");
  const [message, setMessage] = useState("Ingresa un username para crear una obra generativa.");
  const [payload, setPayload] = useState(null);
  const [extractorStatus, setExtractorStatus] = useState(null);

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

  const handleAnalyze = async (username) => {
    setStatus("cargando");
    setMessage("Recolectando huellas digitales del perfil...");
    setPayload(null);

    try {
      const response = await axios.post(`${API_BASE}/analyze-profile`, { username, limit: 50 });
      setPayload(response.data);
      setStatus("terminado");
      setMessage("Payload completo recibido. La constelacion ya puede dibujarse.");
    } catch (error) {
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

  return (
    <main className="mx-auto w-[min(1180px,94vw)] py-8 md:py-10">
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 px-5 py-7 shadow-2xl shadow-slate-950/40 backdrop-blur md:px-8">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-sky-300/15 blur-2xl" />
        <div className="absolute -bottom-14 left-1/3 h-36 w-36 rounded-full bg-amber-300/15 blur-2xl" />
        <p className="text-xs uppercase tracking-[0.22em] text-sky-300">Arte generativo Instagram</p>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight text-slate-50 md:text-5xl">
          Acuarela de constelacion digital
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-300 md:text-base">{message}</p>
      </header>

      <InputForm onSubmit={handleAnalyze} disabled={status === "cargando" || !extractorReady} helperMessage={helperMessage} />

      <div className="mt-3">
        <button
          type="button"
          onClick={() => {
            setPayload(samplePayload);
            setStatus("terminado");
            setMessage("Payload de prueba cargado localmente.");
          }}
          className="rounded-lg border border-sky-300/35 bg-sky-300/10 px-3 py-2 text-xs font-semibold text-sky-100 transition hover:bg-sky-300/20"
        >
          Cargar sample payload
        </button>
      </div>

      {payload ? <DigitalExposureArtwork data={payload} width={1080} height={1080} /> : null}
    </main>
  );
}

export default App;
