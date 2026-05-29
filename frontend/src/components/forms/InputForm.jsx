import { useState } from "react";

const INSTAGRAM_USERNAME_REGEX = /^[a-zA-Z0-9._]{1,30}$/;

function normalizeInstagramInput(value) {
  let next = (value || "").trim();

  next = next.replace(/^@+/, "");

  return next;
}

function InputForm({ onSubmit, disabled, helperMessage }) {
  const [username, setUsername] = useState("");
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
    onSubmit(normalizedUsername);
  };

  return (
    <form className="glass-panel mt-6 space-y-3 p-4 md:p-5" onSubmit={handleSubmit}>
      <label htmlFor="username" className="block text-sm font-medium text-slate-200">
        Instagram username
      </label>
      <div className="flex flex-col gap-3 md:flex-row">
        <input
          id="username"
          type="text"
          placeholder="ej: natgeo"
          value={username}
          onBlur={() => setTouched(true)}
          onChange={(event) => setUsername(event.target.value)}
          disabled={disabled}
          className="w-full rounded-xl border border-white/15 bg-slate-950/65 px-4 py-3 text-sm text-slate-100 outline-none ring-0 transition placeholder:text-slate-500 focus:border-amber-300 focus:shadow-[0_0_0_3px_rgba(251,191,36,0.16)]"
        />
        <button
          type="submit"
          disabled={disabled}
          className="rounded-xl bg-gradient-to-r from-amber-300 to-orange-300 px-6 py-3 text-sm font-bold text-slate-900 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {disabled ? "Procesando..." : "Analizar"}
        </button>
      </div>
      <div className="min-h-5 text-xs">
        {hasError ? (
          <p className="text-rose-300">Usa 1-30 caracteres: letras, numeros, punto o guion bajo.</p>
        ) : (
          <p className="text-slate-400">{helperMessage || "Ingresa solo el username de Instagram (ejemplo: natgeo)."}</p>
        )}
      </div>
    </form>
  );
}

export default InputForm;
