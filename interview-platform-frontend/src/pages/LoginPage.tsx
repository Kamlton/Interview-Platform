import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { apiError } from "../api/client";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@local");
  const [password, setPassword] = useState("Admin#12345");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={onSubmit}>
        <h1>Вход в систему</h1>
        <div className="sub">Платформа технических собеседований</div>

        {error && <div className="state error" style={{ marginBottom: 14 }}>{error}</div>}

        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input id="email" className="input" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
        </div>
        <div className="field">
          <label htmlFor="pwd">Пароль</label>
          <input id="pwd" className="input" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </div>

        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Входим…" : "Войти"}
        </button>

        <div className="hint-box">Демо-доступ: admin@local / Admin#12345</div>
      </form>
    </div>
  );
}
