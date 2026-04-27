function ProgressViewer({ step, message, progress, status }) {
  const statusColorMap = {
    cargando: "#64d4ff",
    listo: "#b0bdd0",
    procesando: "#ffb757",
    terminado: "#6fdc8c",
    error: "#ff6b6b",
  };

  return (
    <section className="progress-viewer">
      <div className="status-badge">
        Estado: <strong style={{ color: statusColorMap[status] || "#f4f6f8" }}>{status}</strong>
      </div>
      <p className="current-step">Paso: {step || "-"}</p>
      <p className="current-message">{message || "Esperando proceso..."}</p>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <p className="progress-label">{progress}%</p>
    </section>
  );
}

export default ProgressViewer;
