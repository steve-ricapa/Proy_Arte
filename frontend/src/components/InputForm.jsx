import { useState } from "react";

function InputForm({ onSubmit, disabled }) {
  const [username, setUsername] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!username.trim() || disabled) {
      return;
    }
    onSubmit(username.trim());
  };

  return (
    <form className="input-form" onSubmit={handleSubmit}>
      <label htmlFor="username">Instagram username</label>
      <div className="input-row">
        <input
          id="username"
          type="text"
          placeholder="ej: natgeo"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          disabled={disabled}
        />
        <button type="submit" disabled={disabled}>
          {disabled ? "Procesando..." : "Analizar"}
        </button>
      </div>
    </form>
  );
}

export default InputForm;
