import { useEffect, useState, type FormEvent } from "react";
import { vacanciesApi } from "../api";
import { apiError } from "../api/client";
import type { Vacancy } from "../types";
import { PageHeader, Spinner, EmptyState, ErrorState, StatusBadge } from "../components/ui";

export default function VacanciesPage() {
  const [items, setItems] = useState<Vacancy[] | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try { setItems(await vacanciesApi.list()); } catch (e) { setError(apiError(e)); }
  }
  useEffect(() => { load(); }, []);

  async function add(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try { await vacanciesApi.create(title, description || undefined); setTitle(""); setDescription(""); await load(); }
    catch (err) { setError(apiError(err)); } finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader title="Вакансии" />
      {error && <ErrorState message={error} />}
      <div className="cols">
        <div className="panel table-wrap">
          {!items ? <Spinner /> : items.length === 0 ? <EmptyState title="Вакансий нет" /> : (
            <table className="data">
              <thead><tr><th>Название</th><th>Статус</th></tr></thead>
              <tbody>{items.map((v) => (
                <tr key={v.id}><td>{v.title}</td><td><StatusBadge status={v.status} /></td></tr>
              ))}</tbody>
            </table>
          )}
        </div>
        <form className="card" onSubmit={add}>
          <h2>Новая вакансия</h2>
          <div className="field"><label>Название *</label>
            <input className="input" value={title} required onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="field"><label>Описание</label>
            <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="btn-row"><button className="btn" disabled={busy}>{busy ? "Сохраняем…" : "Добавить"}</button></div>
        </form>
      </div>
    </>
  );
}
