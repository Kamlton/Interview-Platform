import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { vacanciesApi } from "../api";
import { apiError } from "../api/client";
import type { Vacancy } from "../types";
import { PageHeader, Spinner, ErrorState } from "../components/ui";
import type { Competency } from "../types";

const LEVELS = ["Junior", "Middle", "Senior"];
const EXPERIENCE_OPTIONS = ["0-1 года", "1-3 года", "3-5 лет", "5+ лет"];
const WORK_HOURS_OPTIONS = [4, 6, 8, 10, 12];

const formatSalary = (value: number | undefined) => {
  if (!value) return "—";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
};

export default function VacancyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("");
  const [description, setDescription] = useState("");
  const [salaryFrom, setSalaryFrom] = useState("");
  const [salaryTo, setSalaryTo] = useState("");
  const [experience, setExperience] = useState("");
  const [schedule, setSchedule] = useState("");
  const [workHours, setWorkHours] = useState<number | "">("");
  const [workFormat, setWorkFormat] = useState("");
  const [formCompetencies, setFormCompetencies] = useState<any[]>([]);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const items = await vacanciesApi.list();
      const found = items.find((v) => v.id === id);
      if (found) {
        setVacancy(found);
        setTitle(found.title || "");
        setLevel(found.level || "");
        setDescription(found.description || "");
        setSalaryFrom(found.salaryFrom?.toString() || "");
        setSalaryTo(found.salaryTo?.toString() || "");
        setExperience(found.experience || "");
        setSchedule(found.schedule || "");
        setWorkHours(found.workHours || "");
        setWorkFormat(found.workFormat || "");

        try {
          const comps = await vacanciesApi.getCompetencies(id);
          setCompetencies(comps);
          setFormCompetencies(comps.map(c => ({
            id: c.id,
            name: c.name,
            category: c.category || "",
            description: c.description || "",
            weight: 1
          })));
        } catch (e) {
          console.error("Ошибка загрузки компетенций:", e);
          setCompetencies([]);
          setFormCompetencies([]);
        }
      } else {
        setError("Вакансия не найдена");
      }
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
        const cleanNumber = (value: string) => {
            if (!value) return undefined;
            const cleaned = value.replace(/[^0-9]/g, "");
            return cleaned ? Number(cleaned) : undefined;
        };
        const filteredCompetencies = formCompetencies
        .filter(c => c.name && c.name.trim() !== "")
        .map((c) => ({
            name: c.name.trim(),
            category: c.category || "",
            description: c.description || "",
            weight: c.weight || 1,
        }));
      const payload = {
        title,
        level: level || undefined,
        description,
        salaryFrom: cleanNumber(salaryFrom),
        salaryTo: cleanNumber(salaryTo),
        experience: experience || undefined,
        schedule: schedule || undefined,
        workHours: workHours || undefined,
        workFormat: workFormat || undefined,
        status: vacancy?.status || "Open",
        competencies: filteredCompetencies,
      };

      await vacanciesApi.update(id!, payload);
      setIsEditing(false);
      await load();
    } catch (err) {
        setError(apiError(err));
    } finally {
        setBusy(false);
    }
  }

  function cancelEdit() {
    setIsEditing(false);
    if (vacancy) {
      setTitle(vacancy.title || "");
      setLevel(vacancy.level || "");
      setDescription(vacancy.description || "");
      setSalaryFrom(vacancy.salaryFrom?.toString() || "");
      setSalaryTo(vacancy.salaryTo?.toString() || "");
      setExperience(vacancy.experience || "");
      setSchedule(vacancy.schedule || "");
      setWorkHours(vacancy.workHours || "");
      setWorkFormat(vacancy.workFormat || "");
      setFormCompetencies(competencies.map(c => ({
        id: c.id,
        name: c.name,
        category: c.category || "",
        description: c.description || "",
        weight: 1
      })));
    }
    setError(null);
  }

  function addCompetency() {
    setFormCompetencies([...formCompetencies, { name: "", category: "", weight: 1 }]);
  }

  function removeCompetency(index: number) {
    setFormCompetencies(formCompetencies.filter((_, i) => i !== index));
  }

  function updateCompetency(index: number, field: string, value: string) {
    const next = [...formCompetencies];
    next[index] = { ...next[index], [field]: value };
    setFormCompetencies(next);
  }

  if (loading) return <Spinner />;
  if (error && !vacancy) return <ErrorState message={error} />;
  if (!vacancy) return null;

  return (
    <>
      <PageHeader title={vacancy.title}>
        <div style={{ display: "flex", gap: 8 }}>
          {!isEditing && (
            <button className="btn" onClick={() => setIsEditing(true)}>
              Редактировать
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => navigate("/vacancies")}>
            К реестру
          </button>
        </div>
      </PageHeader>

      {isEditing ? (
        <div className="card" style={{ maxWidth: 800 }}>
          {error && <ErrorState message={error} />}
          <form onSubmit={handleUpdate}>
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
              />
            </div>

            <div className="field">
                <label>Заработная плата</label>
                <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "12px",
                    flexWrap: "wrap"
                }}>
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

            <div className="field">
              <label>Формат работы</label>
              <input
                className="input"
                placeholder="удалённо, гибрид, офис"
                value={workFormat}
                onChange={(e) => setWorkFormat(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Компетенции</label>
              {formCompetencies.map((c, i) => (
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
                    value={c.category || ""}
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
              <button type="button" className="btn btn-ghost" onClick={cancelEdit}>
                Отмена
              </button>
              <button className="btn" type="submit" disabled={busy}>
                {busy ? "Сохраняем…" : "Сохранить"}
              </button>
            </div>
          </form>
        </div>
      ) : (


        <div className="card" style={{ maxWidth: 800 }}>
          <dl className="kv">
            <dt>Название</dt>
            <dd>{vacancy.title}</dd>

            <dt>Уровень</dt>
            <dd>{vacancy.level || "—"}</dd>

            <dt>Описание</dt>
            <dd>{vacancy.description || "—"}</dd>

            <dt>Заработная плата</dt>
            <dd>
              {vacancy.salaryFrom || vacancy.salaryTo ? (
                <span>
                  от {formatSalary(vacancy.salaryFrom)} до {formatSalary(vacancy.salaryTo)}
                </span>
              ) : (
                "—"
              )}
            </dd>

            <dt>Опыт работы</dt>
            <dd>{vacancy.experience || "—"}</dd>

            <dt>График работы</dt>
            <dd>{vacancy.schedule || "—"}</dd>

            <dt>Рабочие часы</dt>
            <dd>{vacancy.workHours ? `${vacancy.workHours} ч.` : "—"}</dd>

            <dt>Формат работы</dt>
            <dd>{vacancy.workFormat || "—"}</dd>

            <dt>Компетенции</dt>
            <dd>
            {competencies.length === 0 ? (
                "—"
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {competencies.map((c) => (
                    <div key={c.id}>
                    {c.name} {c.category && <span style={{ color: "var(--text-muted)" }}>({c.category})</span>}
                    </div>
                ))}
                </div>
            )}
            </dd>
          </dl>
        </div>
      )}
    </>
  );
}