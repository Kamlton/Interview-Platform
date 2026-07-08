import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { vacanciesApi } from "../api";
import { apiError } from "../api/client";
import type { Vacancy } from "../types";
import { PageHeader, Spinner, ErrorState } from "../components/ui";
import type { Competency } from "../types";
import { useToast } from "../components/ToastContext";

const LEVELS = ["Junior", "Middle", "Senior"];
const EXPERIENCE_OPTIONS = ["0-1 года", "1-3 года", "3-5 лет", "5+ лет"];
const WORK_HOURS_OPTIONS = [4, 6, 8, 10, 12];

export default function VacancyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

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
        setSalaryFrom(found.salaryFrom ? new Intl.NumberFormat("ru-RU").format(found.salaryFrom) : "");
        setSalaryTo(found.salaryTo ? new Intl.NumberFormat("ru-RU").format(found.salaryTo) : "");
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
      showToast(`Вакансия "${payload.title}" успешно обновлена.`);
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
      setSalaryFrom(vacancy.salaryFrom ? new Intl.NumberFormat("ru-RU").format(vacancy.salaryFrom) : "");
      setSalaryTo(vacancy.salaryTo ? new Intl.NumberFormat("ru-RU").format(vacancy.salaryTo) : "");
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
<PageHeader title={isEditing ? "Редактирование вакансии" : "Информация о вакансии"}>
  <div style={{ display: "flex", gap: 15, alignItems: "center" }}>
    {isEditing ? (
      <>
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Сохраняем…" : "Сохранить"}
        </button>
        <button className="btn btn-ghost" type="button" disabled={busy} onClick={cancelEdit}>
          Отменить редактирование
        </button>
      </>
    ) : (
      <button className="btn" type="button" onClick={() => setIsEditing(true)}>
        Редактировать
      </button>
    )}
    
    {/* Вертикальный разделитель */}
    <div style={{
      width: "1px",
      backgroundColor: "var(--border-color, #ccc)", // Используй переменную цвета границ из своего проекта или обычный hex
      alignSelf: "stretch",
      opacity: 0.6 // Немного приглушим, чтобы не бросался в глаза сильнее кнопок
    }} />

    <button className="btn btn-ghost" type="button" onClick={() => navigate("/vacancies")}>
      Назад к вакансиям
    </button>
  </div>
</PageHeader>

      {error && <ErrorState message={error} />}

      <div className="cols">
        <form className="card" onSubmit={handleUpdate}>
          
          <div className="field">
            <label>Название *</label>
            <input
              className="input"
              value={title}
              required
              disabled={!isEditing}
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
                  disabled={!isEditing}
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
              disabled={!isEditing}
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
                disabled={!isEditing}
                onChange={(e) => setSalaryFrom(e.target.value.replace(/[^0-9]/g, ""))}
                onBlur={() => {
                  if (salaryFrom) {
                    const num = Number(salaryFrom.replace(/[^0-9]/g, ""));
                    if (num) setSalaryFrom(new Intl.NumberFormat("ru-RU").format(num));
                  }
                }}
                onFocus={() => setSalaryFrom(salaryFrom.replace(/[^0-9]/g, ""))}
                style={{ width: "140px" }}
              />
              <span style={{ fontSize: 14, color: "var(--text-muted)" }}>до</span>
              <input
                className="input"
                type="text"
                placeholder="0"
                value={salaryTo}
                disabled={!isEditing}
                onChange={(e) => setSalaryTo(e.target.value.replace(/[^0-9]/g, ""))}
                onBlur={() => {
                  if (salaryTo) {
                    const num = Number(salaryTo.replace(/[^0-9]/g, ""));
                    if (num) setSalaryTo(new Intl.NumberFormat("ru-RU").format(num));
                  }
                }}
                onFocus={() => setSalaryTo(salaryTo.replace(/[^0-9]/g, ""))}
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
                  disabled={!isEditing}
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
                disabled={!isEditing}
                onChange={(e) => setSchedule(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Формат работы</label>
              <input
                className="input"
                placeholder="удалённо, гибрид, офис"
                value={workFormat}
                disabled={!isEditing}
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
                  disabled={!isEditing}
                  onClick={() => setWorkHours(workHours === h ? "" : h)}
                  style={{ fontSize: 14 }}
                >
                  {h} ч.
                </button>
              ))}
            </div>
          </div>

          
        </form>

        {/* Правая колонка: Блок Компетенций, аналогично блоку Собеседований у кандидата */}

        <div>
          <div className="card">
            <div className="field"> <label>Компетенции вакансии</label> </div>
            
            {formCompetencies.length === 0 && !isEditing ? (
              <div className="muted">Компетенции не указаны.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {formCompetencies.map((c, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center" }}>

                    <input
                    className="input"
                    placeholder="Название компетенции"
                    value={c.name}
                    required
                    onChange={(e) => updateCompetency(i, "name", e.target.value)}
                  />
                    
                    {/* Если редактируем — показываем выпадающий список, если смотрим — заблокированный инпут */}
                    {isEditing ? (
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
                    ) : (
                      <input
                        className="input"
                        value={c.category}
                        disabled
                        placeholder="Категория"
                      />
                    )}

                    {isEditing && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: "0 12px", minHeight: "38px" }}
                        onClick={() => removeCompetency(i)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                {isEditing && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ width: "100%", marginTop: "8px" }}
                    onClick={addCompetency}
                  >
                    + Добавить компетенцию
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}