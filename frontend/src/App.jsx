import { useEffect, useRef, useState } from "react";
import InputForm from "./components/InputForm";
import ProgressViewer from "./components/ProgressViewer";
import ImageCanvas from "./components/ImageCanvas";

const API_BASE = "http://localhost:8000";
const WS_BASE = "ws://localhost:8000";

function App() {
  const [status, setStatus] = useState("cargando");
  const [processId, setProcessId] = useState("");
  const [step, setStep] = useState("");
  const [message, setMessage] = useState("Inicializando interfaz...");
  const [progress, setProgress] = useState(0);
  const [imageBase64, setImageBase64] = useState("");

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const terminalStatusRef = useRef(false);

  useEffect(() => {
    setStatus("listo");
    setMessage("Ingresa un username para comenzar.");
    return () => {
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = (id) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const socket = new WebSocket(`${WS_BASE}/ws/${id}`);
    wsRef.current = socket;

    socket.onopen = () => {
      reconnectAttemptsRef.current = 0;
      setMessage("Conectado. Esperando eventos del pipeline...");
    };

    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      setStep(payload.step || "");
      setProgress(payload.progress || 0);
      setMessage(payload.message || "Procesando...");

      if (payload.image) {
        setImageBase64(payload.image);
      }

      if (payload.step === "completed") {
        terminalStatusRef.current = true;
        setStatus("terminado");
      } else if (payload.step === "error") {
        terminalStatusRef.current = true;
        setStatus("error");
      } else {
        setStatus("procesando");
      }
    };

    socket.onclose = () => {
      if (terminalStatusRef.current) {
        return;
      }
      if (reconnectAttemptsRef.current >= 5) {
        setStatus("error");
        setMessage("No se pudo reconectar el WebSocket.");
        return;
      }

      reconnectAttemptsRef.current += 1;
      const attempt = reconnectAttemptsRef.current;
      const waitMs = Math.min(1000 * attempt, 5000);
      setMessage(`Reconectando WebSocket (intento ${attempt})...`);

      reconnectTimerRef.current = window.setTimeout(() => {
        connectWebSocket(id);
      }, waitMs);
    };

    socket.onerror = () => {
      socket.close();
    };
  };

  const handleAnalyze = async (username) => {
    terminalStatusRef.current = false;
    reconnectAttemptsRef.current = 0;
    setStatus("cargando");
    setStep("starting");
    setProgress(0);
    setImageBase64("");
    setMessage("Solicitando análisis al backend...");

    try {
      const response = await fetch(`${API_BASE}/analyze-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        throw new Error("No se pudo iniciar el análisis.");
      }

      const data = await response.json();
      setProcessId(data.process_id);
      setStatus("procesando");
      connectWebSocket(data.process_id);
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Error al iniciar el análisis.");
    }
  };

  return (
    <main className="app-shell">
      <header>
        <p className="eyebrow">Realtime Identity Rendering</p>
        <h1>Instagram Generative Analyzer</h1>
        <p>
          Convierte metadata, hashtags y engagement en una pieza visual que se va construyendo
          en vivo por batches.
        </p>
      </header>

      <InputForm onSubmit={handleAnalyze} disabled={status === "cargando" || status === "procesando"} />

      <div className="dashboard-grid">
        <ProgressViewer step={step} message={message} progress={progress} status={status} />
        <ImageCanvas imageBase64={imageBase64} />
      </div>

      <footer>
        <span>process_id: {processId || "-"}</span>
      </footer>
    </main>
  );
}

export default App;
