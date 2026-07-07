import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { vacanciesApi } from "../api";
import { apiError } from "../api/client";
import type { Vacancy } from "../types";
import { PageHeader, Spinner, EmptyState, ErrorState } from "../components/ui";
import { useToast } from "../components/ToastContext"; // Импортируем контекст тостов

const LEVELS = ["Junior", "Middle", "Senior"];
const EXPERIENCE_OPTIONS = ["0-1 года", "1-3 года", "3-5 лет", "5+ лет"];
const WORK_HOURS_OPTIONS = [4, 6, 8, 10, 12];

export default function VacanciesPage() {
  const navigate = useNavigate();
  const { showToast } = useToast(); // Инициализируем уведомления

  const [items, setItems] = useState<Vacancy[] | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("");
  const [description, setDescription] = useState("");
  const [salaryFrom, setSalaryFrom] = useState("");
  const [salaryTo, setSalaryTo] = useState("");
  const [experience, setExperience] = useState("");
  const [schedule, setSchedule] = useState("");
  const [workHours, setWorkHours] = useState<number | "">("");
  const [workFormat, setWorkFormat] = useState("");
  const [competencies, setCompetencies] = useState<any[]>([]);

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
        level: level || undefined,
        description,
        salaryFrom: salaryFrom ? Number(salaryFrom.replace(/[^0-9]/g, "")) : undefined,
        salaryTo: salaryTo ? Number(salaryTo.replace(/[^0-9]/g, "")) : undefined,
        experience: experience || undefined,
        schedule: schedule || undefined,
        workHours: workHours || undefined,
        workFormat: workFormat || undefined,
        competencies: competencies.map(c => ({ 
          name: c.name, 
          category: c.category || "",
          description: c.description || "",
          weight: c.weight || 1 
        }))
      };
      await vacanciesApi.create(payload); 

      // Вызываем тост об успешном создании
      showToast(`Новая вакансия "${payload.title}" успешно добавлена.`);

      setCompetencies([]);
      setTitle("");
      setLevel("");
      setDescription("");
      setSalaryFrom("");
      setSalaryTo("");
      setExperience("");
      setSchedule("");
      setWorkHours("");
      setWorkFormat("");
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
      {/* Динамический заголовок: меняется в зависимости от того, открыта ли форма */}
      <PageHeader title={isFormOpen ? "Новая вакансия" : "Вакансии"}>
        {isFormOpen ? (
          <button className="btn btn-ghost" onClick={() => setIsFormOpen(false)}>
            Назад
          </button>
        ) : (
          <button className="btn" onClick={() => setIsFormOpen(true)}>
            Добавить вакансию
          </button>
        )}
      </PageHeader>

      {isFormOpen && (
        <div style={{ marginBottom: "var(--gap)" }}>
          {error && <ErrorState message={error} />}
          
          <div className="cols">
            <form className="card" onSubmit={add}>
              {/* h2 отсюда убран, так как заголовок теперь в PageHeader */}
              
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
                <label>Уровень</label>
                <div className="btn-row" style={{ flexWrap: "wrap", gap: 8 }}>
                  {LEVELS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      className={`btn ${level === l ? "btn-primary" : "btn-ghost"}`}
                      onClick={() => setLevel(level === l ? "" : l)}
                      style={{ fontSize: 14 }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>Описание</label>
                <textarea
                  className="textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                />
              </div>

              <div className="field">
                <label>Заработная плата</label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, color: "var(--text-muted)" }}>от</span>
                  <input
                    className="input"
                    type="text"
                    placeholder="0"
                    value={salaryFrom}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^0-9]/g, "");
                      setSalaryFrom(cleaned);
                    }}
                    onBlur={() => {
                      if (salaryFrom) {
                        const num = Number(salaryFrom.replace(/[^0-9]/g, ""));
                        if (num) setSalaryFrom(new Intl.NumberFormat("ru-RU").format(num));
                      }
                    }}
                    onFocus={() => {
                      const num = Number(salaryFrom.replace(/[^0-9]/g, ""));
                      if (num) setSalaryFrom(num.toString());
                    }}
                    style={{ width: "140px" }}
                  />
                  <span style={{ fontSize: 14, color: "var(--text-muted)" }}>до</span>
                  <input
                    className="input"
                    type="text"
                    placeholder="0"
                    value={salaryTo}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^0-9]/g, "");
                      setSalaryTo(cleaned);
                    }}
                    onBlur={() => {
                      if (salaryTo) {
                        const num = Number(salaryTo.replace(/[^0-9]/g, ""));
                        if (num) setSalaryTo(new Intl.NumberFormat("ru-RU").format(num));
                      }
                    }}
                    onFocus={() => {
                      const num = Number(salaryTo.replace(/[^0-9]/g, ""));
                      if (num) setSalaryTo(num.toString());
                    }}
                    style={{ width: "140px" }}
                  />
                </div>
              </div>

              <div className="field">
                <label>Опыт работы</label>
                <div className="btn-row" style={{ flexWrap: "wrap", gap: 8 }}>
                  {EXPERIENCE_OPTIONS.map((exp) => (
                    <button
                      key={exp}
                      type="button"
                      className={`btn ${experience === exp ? "btn-primary" : "btn-ghost"}`}
                      onClick={() => setExperience(experience === exp ? "" : exp)}
                      style={{ fontSize: 14 }}
                    >
                      {exp}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid-2">
                <div className="field">
                  <label>График работы</label>
                  <input
                    className="input"
                    placeholder="например: 5/2, 2/2, гибкий"
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Формат работы</label>
                  <input
                    className="input"
                    placeholder="удалённо, гибрид, офис"
                    value={workFormat}
                    onChange={(e) => setWorkFormat(e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label>Рабочие часы в день</label>
                <div className="btn-row" style={{ flexWrap: "wrap", gap: 8 }}>
                  {WORK_HOURS_OPTIONS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      className={`btn ${workHours === h ? "btn-primary" : "btn-ghost"}`}
                      onClick={() => setWorkHours(workHours === h ? "" : h)}
                      style={{ fontSize: 14 }}
                    >
                      {h} ч.
                    </button>
                  ))}
                </div>
              </div>

              <div className="btn-row" style={{ marginTop: "24px" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setIsFormOpen(false);
                    setError(null);
                    setTitle("");
                    setLevel("");
                    setDescription("");
                    setSalaryFrom("");
                    setSalaryTo("");
                    setExperience("");
                    setSchedule("");
                    setWorkHours("");
                    setWorkFormat("");
                    setCompetencies([]);
                  }}
                >
                  Отмена
                </button>
                <button className="btn" type="submit" disabled={busy}>
                  {busy ? "Сохраняем…" : "Создать"}
                </button>
              </div>
            </form>

            {/* Правая колонка: Блок Компетенций */}
            <div>
              <div className="card">
                <h2>Компетенции вакансии</h2>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {competencies.length === 0 && (
                    <div className="muted" style={{ marginBottom: "8px" }}>
                      Компетенции пока не добавлены.
                    </div>
                  )}

                  {competencies.map((c, i) => (
                    <div 
                      key={i} 
                      style={{ display: "flex", gap: "8px", alignItems: "center" }}
                    >
                      <input
                        className="input"
                        placeholder="Название компетенции"
                        value={c.name}
                        required
                        onChange={(e) => updateCompetency(i, "name", e.target.value)}
                      />
                      
                      <select
                        className="select"
                        value={c.category}
                        required
                        onChange={(e) => updateCompetency(i, "category", e.target.value)}
                      >
                        <option value="" disabled hidden>Выберите категорию</option>
                        <option value="Hard Skills">Hard Skills</option>
                        <option value="Soft Skills">Soft Skills</option>
                        <option value="Tech Skills">Tech Skills</option>
                        <option value="Other">Other</option>
                      </select>
                      
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: "0 12px", minHeight: "38px" }}
                        onClick={() => removeCompetency(i)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ width: "100%", marginTop: "8px" }}
                    onClick={addCompetency}
                  >
                    + Добавить компетенцию
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Реестр вакансий (скрывается или остаётся внизу в зависимости от логики макета) */}
      <div className="toolbar">
        <input
          className="input search"
          placeholder="Поиск по названию или описанию"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
                <th>Уровень</th>
                <th>Описание</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems?.map((v) => (
                <tr 
                  key={v.id} 
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/vacancies/${v.id}`)}
                >
                  <td>{v.title}</td>
                  <td>{v.level || "—"}</td>
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