function ImageCanvas({ imageBase64, status, step }) {
  return (
    <section className="glass-panel relative min-h-[360px] overflow-hidden p-3 md:min-h-[520px] md:p-4">
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-slate-950/70 to-transparent px-4 py-3 text-xs text-slate-300">
        <span className="font-medium">Lienzo generativo en vivo</span>
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-slate-400">{step || "esperando"}</span>
      </div>
      {imageBase64 ? (
        <img
          src={`data:image/png;base64,${imageBase64}`}
          alt="Generative representation"
          className="h-full w-full rounded-xl border border-white/10 object-contain shadow-xl shadow-slate-950/40 transition duration-700"
        />
      ) : (
        <div className="flex h-full min-h-[320px] w-full items-center justify-center rounded-xl border border-dashed border-white/15 bg-slate-900/40 px-5 text-center">
          <div>
            <p className="pulse-soft text-sm font-medium text-slate-200">La imagen aparecera en tiempo real.</p>
            <p className="mt-2 text-xs text-slate-400">
              Estado actual: <span className="font-semibold text-slate-300">{status}</span>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default ImageCanvas;
