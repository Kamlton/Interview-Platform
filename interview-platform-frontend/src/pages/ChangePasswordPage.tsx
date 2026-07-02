import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api";
import { apiError } from "../api/client";
import { PageHeader, ErrorState } from "../components/ui";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (next.length < 6) { setError("Новый пароль не короче 6 символов"); return; }
    if (next !== confirm) { setError("Пароли не совпадают"); return; }
    setBusy(true);
    try {
      await authApi.changePassword(current, next);
      setDone(true);
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Смена пароля">
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>Назад</button>
      </PageHeader>

      <form className="card" style={{ maxWidth: 460 }} onSubmit={submit}>
        {error && <ErrorState message={error} />}
        {done && <div className="state" style={{ color: "var(--green)", justifyContent: "flex-start" }}>
          Пароль изменён. Другие сессии завершены.
        </div>}
        <div className="field"><label>Текущий пароль *</label>
          <input className="input" type="password" value={current} required
            onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" /></div>
        <div className="field"><label>Новый пароль *</label>
          <input className="input" type="password" value={next} required minLength={6}
            onChange={(e) => setNext(e.target.value)} autoComplete="new-password" /></div>
        <div className="field"><label>Повтор нового пароля *</label>
          <input className="input" type="password" value={confirm} required
            onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" /></div>
        <div className="btn-row">
          <button className="btn" type="submit" disabled={busy}>{busy ? "Сохраняем…" : "Сменить пароль"}</button>
        </div>
      </form>
    </>
  );
}
