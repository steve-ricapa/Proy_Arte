type TimelineControlsProps = {
  progress: number;
  onProgressChange: (value: number) => void;
  speed: number;
  onSpeedChange: (value: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onScrubStart: () => void;
  onScrubEnd: () => void;
  currentLabel: string;
  startLabel: string;
  endLabel: string;
  disabled?: boolean;
  className?: string;
};

export default function TimelineControls({
  progress,
  onProgressChange,
  speed,
  onSpeedChange,
  isPlaying,
  onTogglePlay,
  onReset,
  onScrubStart,
  onScrubEnd,
  currentLabel,
  startLabel,
  endLabel,
  disabled = false,
  className = "",
}: TimelineControlsProps) {
  return (
    <div
      className={`mt-4 md:mt-5 rounded-2xl border border-white/10 bg-slate-950/55 px-3 py-3 md:px-4 md:py-4 shadow-inner ${className}`}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerMove={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-purple-200/80">Temporal Reader</p>
          <p className="mt-1 text-base md:text-lg font-semibold text-white">{currentLabel}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlay}
            disabled={disabled}
            className="rounded-full border border-purple-300/20 bg-purple-300/10 px-3 py-2 md:px-4 text-[11px] md:text-xs font-semibold uppercase tracking-[0.16em] text-purple-100 transition hover:bg-purple-300/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={disabled}
            className="rounded-full border border-white/12 bg-white/5 px-3 py-2 md:px-4 text-[11px] md:text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-4">
        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          value={progress}
          disabled={disabled}
          onChange={(event) => onProgressChange(Number(event.target.value))}
          onPointerDown={onScrubStart}
          onPointerUp={onScrubEnd}
          onPointerCancel={onScrubEnd}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-purple-400 disabled:cursor-not-allowed disabled:opacity-40"
        />
        <div className="mt-2 flex items-center justify-between gap-3 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.16em] md:tracking-[0.18em] text-slate-500">
          <span>{startLabel}</span>
          <span>{endLabel}</span>
        </div>
      </div>

      <div className="mt-4 border-t border-white/8 pt-4">
        <div className="mb-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.18em] text-slate-400">
          <span>Speed</span>
          <span>{speed.toFixed(2)}x</span>
        </div>
        <input
          type="range"
          min="0.25"
          max="2"
          step="0.05"
          value={speed}
          disabled={disabled}
          onChange={(event) => onSpeedChange(Number(event.target.value))}
          onPointerDown={onScrubStart}
          onPointerUp={onScrubEnd}
          onPointerCancel={onScrubEnd}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-40"
        />
      </div>
    </div>
  );
}
