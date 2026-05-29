const STEP_LABELS = {
  starting: "Inicializando",
  fetching_instagram_data: "Extraccion con Apify",
  analyzing_metadata: "Analisis de metadatos",
  calculating_metrics: "Calculo de metricas",
  batch_background: "Batch 1/5 Fondo",
  batch_main_node: "Batch 2/5 Nodo principal",
  batch_hashtag_nodes: "Batch 3/5 Nodos hashtags",
  batch_connections: "Batch 4/5 Conexiones",
  batch_details: "Batch 5/5 Detalles",
  completed: "Completado",
  failed: "Fallido",
};

const STEP_ORDER = [
  "starting",
  "fetching_instagram_data",
  "analyzing_metadata",
  "calculating_metrics",
  "batch_background",
  "batch_main_node",
  "batch_hashtag_nodes",
  "batch_connections",
  "batch_details",
  "completed",
  "failed",
];

function StepsTimeline({ currentStep, seenSteps }) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <section className="glass-panel p-5">
      <p className="panel-title">Etapas del proceso</p>
      <div className="mt-4 space-y-2">
        {STEP_ORDER.map((step, index) => {
          const isSeen = seenSteps.includes(step) || (currentIndex >= 0 && index < currentIndex);
          const isActive = currentStep === step;

          return (
            <div
              key={step}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-xs transition ${
                isActive
                  ? "border-sky-300/45 bg-sky-400/10 text-sky-100"
                  : isSeen
                    ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                    : "border-white/8 bg-slate-900/40 text-slate-400"
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isActive ? "bg-sky-300" : isSeen ? "bg-emerald-300" : "bg-slate-600"
                }`}
              />
              <span className="font-medium">{STEP_LABELS[step]}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default StepsTimeline;
