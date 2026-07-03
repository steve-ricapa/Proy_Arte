import { useState } from "react";

const INSTAGRAM_USERNAME_REGEX = /^[a-zA-Z0-9._]{1,30}$/;

function normalizeInstagramInput(value) {
  let next = (value || "").trim();

  next = next.replace(/^@+/, "");

  return next;
}

function InputForm({ onSubmit, disabled, helperMessage }) {
  const [username, setUsername] = useState("");
  const [limit, setLimit] = useState(50);
  const [touched, setTouched] = useState(false);

  const normalizedUsername = normalizeInstagramInput(username);
  const isValid = INSTAGRAM_USERNAME_REGEX.test(normalizedUsername);
  const hasError = touched && normalizedUsername.length > 0 && !isValid;

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (!normalizedUsername || !isValid || disabled) {
      return;
    }
    onSubmit(normalizedUsername, Math.max(1, Math.min(100, Number(limit) || 50)));
  };

  return (
    <form className="glass-panel mt-8 space-y-4 p-6 md:p-8 relative overflow-hidden" onSubmit={handleSubmit}>
      {/* Decorative inner elements */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
      
      <div className="flex items-center justify-between border-b border-purple-500/10 pb-3">
        <label htmlFor="username" className="font-mono text-xs uppercase tracking-[0.2em] text-purple-300 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-ping" />
          [ SISTEMA_EXTRACTOR : INGRESO_USUARIO ]
        </label>
        <span className="font-mono text-[9px] text-slate-500">v1.2.0-secure</span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row items-stretch">
        <div className="relative flex-1">
          <input
            id="username"
            type="text"
            placeholder="Introduce usuario de Instagram (ej: natgeo)"
            value={username}
            onBlur={() => setTouched(true)}
            onChange={(event) => setUsername(event.target.value)}
            disabled={disabled}
            className="w-full rounded-xl border border-purple-500/20 bg-black/45 px-5 py-4 text-sm text-slate-100 outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-purple-500 focus:bg-slate-950/80 focus:shadow-[0_0_20px_rgba(168,85,247,0.25)] font-mono"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] text-purple-400/40 pointer-events-none">
            @
          </span>
        </div>
        <div className="sm:w-[150px]">
          <label htmlFor="posts-limit" className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
            Posts
          </label>
          <input
            id="posts-limit"
            type="number"
            min="1"
            max="100"
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
            disabled={disabled}
            className="w-full rounded-xl border border-purple-500/20 bg-black/45 px-4 py-4 text-sm text-slate-100 outline-none transition-all duration-300 focus:border-purple-500 focus:bg-slate-950/80 focus:shadow-[0_0_20px_rgba(168,85,247,0.25)] font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={disabled}
          className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-4 text-sm font-bold text-white tracking-widest uppercase transition-all duration-300 hover:from-purple-500 hover:to-indigo-500 hover:shadow-[0_0_25px_rgba(168,85,247,0.45)] hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {disabled ? "Procesando..." : "Analizar Perfil"}
        </button>
      </div>
      
      <div className="min-h-5 flex items-center gap-2 font-mono text-[10px]">
        {hasError ? (
          <span className="text-rose-400 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            ERROR: Usa 1-30 caracteres (letras, números, punto o guion bajo).
          </span>
        ) : (
          <span className="text-slate-400 flex items-center gap-1.5">
            <span className="h-1 w-1 bg-purple-500/50 rounded-full" />
            {helperMessage || "Ingresa solo el username de Instagram."} Puedes pedir entre 1 y 100 posts.
          </span>
        )}
      </div>
    </form>
  );
}

export default InputForm;
