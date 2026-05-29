function formatNumber(value) {
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value !== "number") {
    return String(value);
  }
  return new Intl.NumberFormat("es-AR").format(value);
}

function MetricsPanel({ metadata, metrics, analysis }) {
  const topHashtags =
    analysis?.top_hashtags?.map((tag) => ({ hashtag: tag.value, count: tag.count })) || metrics?.top_hashtags || [];
  const followers = metrics?.followers ?? null;
  const avgLikes = analysis?.avg_likes ?? null;
  const avgComments = analysis?.avg_comments ?? null;
  const analyzedPosts = analysis?.total_posts_analyzed ?? null;

  return (
    <section className="glass-panel p-5">
      <p className="panel-title">Metricas detectadas</p>

      {metrics || analysis ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
            <div className="metric-card">
              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Followers</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">{formatNumber(followers)}</p>
            </div>
            <div className="metric-card">
              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Following</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">{formatNumber(metrics?.following)}</p>
            </div>
            <div className="metric-card">
              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Ratio</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">{formatNumber(metrics?.ratio)}</p>
            </div>
            <div className="metric-card">
              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Posts analizados</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">{formatNumber(analyzedPosts)}</p>
            </div>
            <div className="metric-card">
              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Avg Likes</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">{formatNumber(avgLikes)}</p>
            </div>
            <div className="metric-card">
              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Avg Comments</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">{formatNumber(avgComments)}</p>
            </div>
            <div className="metric-card">
              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Perfil</p>
              <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-100">{metadata?.username || "-"}</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/8 bg-slate-900/60 p-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Top hashtags</p>
            {Array.isArray(topHashtags) && topHashtags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {topHashtags.map((tag) => (
                  <span
                    key={`${tag.hashtag}-${tag.count}`}
                    className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1 text-xs text-cyan-100"
                  >
                    #{tag.hashtag} ({tag.count})
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-400">No se detectaron hashtags relevantes.</p>
            )}
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-400">Las metricas apareceran cuando el backend finalice el analisis textual.</p>
      )}
    </section>
  );
}

export default MetricsPanel;
