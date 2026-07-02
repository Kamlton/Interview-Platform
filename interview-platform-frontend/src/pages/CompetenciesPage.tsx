import { useEffect, useState, type FormEvent } from "react";
import { competenciesApi } from "../api";
import { apiError } from "../api/client";
import type { Competency } from "../types";
import { PageHeader, Spinner, EmptyState, ErrorState } from "../components/ui";

export default function CompetenciesPage() {
  const [items, setItems] = useState<Competency[] | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try { setItems(await competenciesApi.list()); } catch (e) { setError(apiError(e)); }
  }
  useEffect(() => { load(); }, []);

  async function add(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try { await competenciesApi.create(name, category || undefined); setName(""); setCategory(""); await load(); }
    catch (err) { setError(apiError(err)); } finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader title="Компетенции" />
      {error && <ErrorState message={error} />}
      <div className="cols">
        <div className="panel table-wrap">
          {!items ? <Spinner /> : items.length === 0 ? <EmptyState title="Компетенций нет" /> : (
            <table className="data">
              <thead><tr><th>Название</th><th>Категория</th></tr></thead>
              <tbody>{items.map((c) => (
                <tr key={c.id}><td>{c.name}</td><td className="muted">{c.category || "—"}</td></tr>
              ))}</tbody>
            </table>
          )}
        </div>
        <form className="card" onSubmit={add}>
          <h2>Новая компетенция</h2>
          <div className="field"><label>Название *</label>
            <input className="input" value={name} required onChange={(e) => setName(e.target.value)} /></div>
          <div className="field"><label>Категория</label>
            <input className="input" value={category} placeholder="Hard / Soft" onChange={(e) => setCategory(e.target.value)} /></div>
          <div className="btn-row"><button className="btn" disabled={busy}>{busy ? "Сохраняем…" : "Добавить"}</button></div>
        </form>
      </div>
    </>
  );
}
