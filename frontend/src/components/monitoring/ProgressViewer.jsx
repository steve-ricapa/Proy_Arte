const statusColorMap = {
  cargando: "text-sky-300",
  listo: "text-slate-300",
  procesando: "text-amber-300",
  terminado: "text-emerald-300",
  error: "text-rose-300",
};

const connectionColorMap = {
  connected: "bg-emerald-300",
  processing: "bg-sky-300",
  reconnecting: "bg-amber-300",
  disconnected: "bg-rose-300",
  idle: "bg-slate-500",
};

function ProgressViewer({
  step,
  message,
  progress,
  status,
  processId,
  connection,
  reconnectAttempt,
  canReconnect,
  onReconnect,
  extractorAuth,
}) {
  return (
    <section className="glass-panel h-full p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="panel-title">Pipeline monitor</p>
        {canReconnect ? (
          <button
            type="button"
            disabled={!canReconnect}
            onClick={onReconnect}
            className="rounded-lg border border-sky-300/40 px-3 py-1.5 text-xs font-semibold text-sky-200 transition hover:bg-sky-300/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reconectar WS
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="metric-card">
          <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Estado</p>
          <p className={`mt-1 text-sm font-semibold ${statusColorMap[status] || "text-slate-200"}`}>{status}</p>
        </div>
        <div className="metric-card">
          <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Conexion</p>
          <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <span className={`h-2.5 w-2.5 rounded-full ${connectionColorMap[connection] || "bg-slate-500"}`} />
            {connection}
            {connection === "reconnecting" ? ` (${reconnectAttempt})` : ""}
          </p>
        </div>
        <div className="metric-card sm:col-span-2">
          <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Extractor</p>
          <p className="mt-1 text-sm font-semibold text-slate-200">
            {extractorAuth?.status || "desconocido"}
            {extractorAuth?.note ? ` - ${extractorAuth.note}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Paso actual</p>
        <p className="text-sm font-semibold text-slate-100">{step || "-"}</p>
        <p className="text-sm text-slate-300" aria-live="polite">
          {message || "Esperando proceso..."}
        </p>
      </div>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-700/70">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-amber-300 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
        <span>{progress}%</span>
        <span className="font-mono">process_id: {processId || "-"}</span>
      </div>
    </section>
  );
}

export default ProgressViewer;
