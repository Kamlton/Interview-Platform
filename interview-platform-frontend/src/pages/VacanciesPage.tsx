import { useEffect, useState, type FormEvent } from "react";
import { vacanciesApi } from "../api";
import { apiError } from "../api/client";
import type { Vacancy } from "../types";
import { PageHeader, Spinner, EmptyState, ErrorState, StatusBadge } from "../components/ui";

export default function VacanciesPage() {
  const [items, setItems] = useState<Vacancy[] | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  const filteredItems = items?.filter((v) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return v.title.toLowerCase().includes(q) || 
           (v.description?.toLowerCase().includes(q) ?? false);
  });

  async function load() {
    try { setItems(await vacanciesApi.list()); } catch (e) { setError(apiError(e)); }
  }
  useEffect(() => { load(); }, []);

  async function add(e: FormEvent) {
    e.preventDefault();
    setBusy(true); 
    setError(null);
    try { 
      const payload = { 
        title, 
        description, 
        competencies: competencies.map(c => ({ 
          name: c.name, 
          category: c.category || "",
          description: c.description || "",
          weight: c.weight || 1 
        }))
      };
      await vacanciesApi.create(payload); 
      setCompetencies([]);
      setTitle("");
      setDescription("");
      setIsFormOpen(false);
      await load();
    } 
    catch (err) { 
      setError(apiError(err)); 
    } 
    finally { 
      setBusy(false); 
    }
  }

  function addCompetency() {
    setCompetencies([...competencies, { name: "", category: "", weight: 1 }]);
  }

  function removeCompetency(index: number) {
    setCompetencies(competencies.filter((_, i) => i !== index));
  }

  function updateCompetency(index: number, field: string, value: string) {
    const next = [...competencies];
    next[index] = { ...next[index], [field]: value };
    setCompetencies(next);
  }

  return (
    <>
      <PageHeader title="Вакансии">
        <button className="btn" onClick={() => setIsFormOpen(true)}>
        Новая вакансия
      </button>
    </PageHeader>
    {isFormOpen && (
      <div className="card" style={{ marginBottom: "var(--gap)" }}>
        <h2>Новая вакансия</h2>
        {error && <ErrorState message={error} />}
        <form onSubmit={add}>
          <div className="field">
            <label>Название *</label>
            <input
              className="input"
              value={title}
              required
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Описание</label>
            <textarea
              className="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Компетенции</label>
            {competencies.map((c, i) => (
              <div key={i} className="field-row" style={{ marginBottom: 8 }}>
                <input
                  className="input"
                  placeholder="Название"
                  value={c.name}
                  onChange={(e) => updateCompetency(i, "name", e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Категория"
                  value={c.category}
                  onChange={(e) => updateCompetency(i, "category", e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => removeCompetency(i)}
                >
                  Удалить
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-sm"
              onClick={addCompetency}
            >
              + Добавить компетенцию
            </button>
          </div>
          <div className="btn-row">
            <button type="button" className="btn btn-ghost" onClick={() => setIsFormOpen(false)}>
              Отмена
            </button>
            <button className="btn" type="submit" disabled={busy}>
              {busy ? "Сохраняем…" : "Создать"}
            </button>
          </div>
        </form>
      </div>
    )}

        <div style={{ marginBottom: "var(--gap)" }}>
        <input
          className="input"
          placeholder="Поиск по названию или описанию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>

      <div className="panel table-wrap">
        {!items ? (
          <Spinner />
        ) : filteredItems?.length === 0 ? (
          <EmptyState title={search ? "Ничего не найдено" : "Вакансий нет"} />
        ) : (
          <table className="data">
            <thead>
              <tr>
                <th>Название</th>
                <th>Статус</th>
                <th>Описание</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems?.map((v) => (
                <tr key={v.id}>
                  <td>{v.title}</td>
                  <td><StatusBadge status={v.status} /></td>
                  <td>{v.description || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
