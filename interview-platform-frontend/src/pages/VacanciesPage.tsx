import { useEffect, useState, useRef, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { vacanciesApi } from "../api";
import { apiError } from "../api/client";
import type { Vacancy } from "../types";
import { PageHeader, Spinner, EmptyState, ErrorState } from "../components/ui";
import { useToast } from "../components/ToastContext";

const LEVELS = ["Junior", "Middle", "Senior"];
const EXPERIENCE_OPTIONS = ["0-1 года", "1-3 года", "3-5 лет", "5+ лет"];
const WORK_HOURS_OPTIONS = [4, 6, 8, 10, 12];

type SortField = "title" | "level" | "schedule" | "workFormat";
type SortOrder = "asc" | "desc" | null;
type DropdownType = "level" | "schedule" | "workFormat" | null;

export default function VacanciesPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [items, setItems] = useState<Vacancy[] | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  // Состояния для формы создания
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

  // Сортировка таблицы
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  // Режим фильтрации и дропдауны
  const [isFilterModeActive, setIsFilterModeActive] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<DropdownType>(null);

  // Временные выбранные фильтры (до клика на OK)
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedSchedules, setSelectedSchedules] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);

  // Применённые фильтры для рендеринга
  const [appliedLevels, setAppliedLevels] = useState<string[]>([]);
  const [appliedSchedules, setAppliedSchedules] = useState<string[]>([]);
  const [appliedFormats, setAppliedFormats] = useState<string[]>([]);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  async function load() {
    try {
      setItems(await vacanciesApi.list());
    } catch (e) {
      setError(apiError(e));
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Закрытие дропдаунов по клику вне
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Получение уникальных значений для фильтров из загруженных данных
  const getUniqueValues = (field: "level" | "schedule" | "workFormat"): string[] => {
    if (!items) return [];
    const values = items.map((item) => item[field] || "—");
    return Array.from(new Set(values)).sort();
  };

  const handleSort = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field);
      setSortOrder("asc");
    } else if (sortOrder === "asc") {
      setSortOrder("desc");
    } else if (sortOrder === "desc") {
      setSortField(null);
      setSortOrder(null);
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return "  ↕";
    if (sortOrder === "asc") return "  ↓";
    if (sortOrder === "desc") return "  ↑";
    return "  ↕";
  };

  // Переключатели чекбоксов во временных состояниях
  const handleToggleLevel = (val: string) => {
    setSelectedLevels((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const handleToggleSchedule = (val: string) => {
    setSelectedSchedules((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const handleToggleFormat = (val: string) => {
    setSelectedFormats((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  // Подтверждение фильтров по кнопке ОК
  const applyLevelFilter = () => {
    setAppliedLevels(selectedLevels);
    setActiveDropdown(null);
  };

  const applyScheduleFilter = () => {
    setAppliedSchedules(selectedSchedules);
    setActiveDropdown(null);
  };

  const applyFormatFilter = () => {
    setAppliedFormats(selectedFormats);
    setActiveDropdown(null);
  };

  // Фильтрация, текстовый поиск и сортировка данных
  const getProcessedItems = (): Vacancy[] => {
    if (!items) return [];

    let result = [...items];

    // 1. Текстовый поиск по названию/описанию
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          (v.description?.toLowerCase().includes(q) ?? false)
      );
    }

    // 2. Применение фильтров колонок (если режим активен)
    if (isFilterModeActive) {
      if (appliedLevels.length > 0) {
        result = result.filter((item) => appliedLevels.includes(item.level || "—"));
      }
      if (appliedSchedules.length > 0) {
        result = result.filter((item) => appliedSchedules.includes(item.schedule || "—"));
      }
      if (appliedFormats.length > 0) {
        result = result.filter((item) => appliedFormats.includes(item.workFormat || "—"));
      }
    }

    // 3. Применение сортировки
    if (!sortField || !sortOrder) return result;

    return result.sort((a, b) => {
      let valA = a[sortField] || "";
      let valB = b[sortField] || "";

      valA = valA.toLowerCase();
      valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  };

  const processedItems = getProcessedItems();

  const isLevelFilterApplied = appliedLevels.length > 0;
  const isScheduleFilterApplied = appliedSchedules.length > 0;
  const isFormatFilterApplied = appliedFormats.length > 0;

  async function add(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Ручная валидация вместо дефолтных облачков браузера
    if (!title.trim()) {
      return;
    }

    const hasInvalidCompetency = competencies.some(c => !c.name.trim() || !c.category);
    if (hasInvalidCompetency) {
      setError("Пожалуйста, заполните название и категорию для всех добавленных компетенций");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        title: title.trim(),
        level: level || undefined,
        description,
        salaryFrom: salaryFrom ? Number(salaryFrom.replace(/[^0-9]/g, "")) : undefined,
        salaryTo: salaryTo ? Number(salaryTo.replace(/[^0-9]/g, "")) : undefined,
        experience: experience || undefined,
        schedule: schedule || undefined,
        workHours: workHours || undefined,
        workFormat: workFormat || undefined,
        competencies: competencies.map((c) => ({
          name: c.name.trim(),
          category: c.category || "",
          description: c.description || "",
          weight: c.weight || 1,
        })),
      };
      await vacanciesApi.create(payload);

      showToast(`Новая вакансия "${payload.title}" успешно добавлена.`);

      // Очистка полей формы
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
    } catch (err) {
      setError(apiError(err));
    } finally {
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
      <PageHeader title={isFormOpen ? "Новая вакансия" : "Вакансии"}>
        <div style={{ display: "flex", gap: 15, alignItems: "center" }}>
          {isFormOpen ? (
            <>
              <button 
                className="btn" 
                type="submit" 
                form="create-vacancy-form"
                disabled={busy}
              >
                {busy ? "Создаем…" : "Создать"}
              </button>

              {/* Вертикальный разделитель */}
              <div style={{
                width: "1px",
                backgroundColor: "var(--border-color, #ccc)",
                alignSelf: "stretch",
                opacity: 0.6
              }} />

              <button className="btn btn-ghost" type="button" onClick={() => setIsFormOpen(false)}>
                Назад к вакансиям
              </button>
            </>
          ) : (
            <button className="btn" type="button" onClick={() => setIsFormOpen(true)}>
              Добавить вакансию
            </button>
          )}
        </div>
      </PageHeader>

      {isFormOpen && (
        <div style={{ marginBottom: "var(--gap)" }}>
          {error && <ErrorState message={error} />}

          {/* Добавлен атрибут noValidate, который отключает системные подсказки браузера */}
          <form id="create-vacancy-form" className="cols" onSubmit={add} noValidate>
            <div className="card">
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
            </div>

            <div>
              <div className="card">
                <div className="field"> <label>Компетенции вакансии</label> </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {competencies.length === 0 && (
                    <div className="muted" style={{ marginBottom: "8px" }}>
                      Компетенции пока не добавлены.
                    </div>
                  )}

                  {competencies.map((c, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
                        <option value="" disabled hidden>
                          Выберите категорию
                        </option>
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
          </form>
        </div>
      )}

      {/* Ниже идёт код таблицы без изменений */}
      <div className="toolbar filter-toolbar">
        <input
          className="input search"
          placeholder="Поиск по названию или описанию"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          type="button"
          className={`btn ${isFilterModeActive ? "btn-primary" : "btn-ghost"}`}
          onClick={() => {
            if (isFilterModeActive) {
              setSelectedLevels([]);
              setSelectedSchedules([]);
              setSelectedFormats([]);
              setAppliedLevels([]);
              setAppliedSchedules([]);
              setAppliedFormats([]);
              setActiveDropdown(null);
            }
            setIsFilterModeActive(!isFilterModeActive);
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"></line>
            <line x1="7" y1="12" x2="17" y2="12"></line>
            <line x1="10" y1="18" x2="14" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className={`panel table-wrap ${activeDropdown ? "dropdown-visible" : ""}`}>
        {!items ? (
          <Spinner />
        ) : processedItems.length === 0 ? (
          <EmptyState title={search || isFilterModeActive ? "Ничего не найдено" : "Вакансий нет"} />
        ) : (
          <table className="data vacancy-table">
            <thead>
              <tr>
                <th className="sortable-th" onClick={() => handleSort("title")}>
                  Название {renderSortIcon("title")}
                </th>

                <th className={`filterable-th ${isFilterModeActive ? "with-padding" : ""}`}>
                  <span className="th-label" onClick={() => handleSort("level")}>
                    Уровень {renderSortIcon("level")}
                  </span>
                  {isFilterModeActive && (
                    <span
                      className={`filter-trigger-btn ${isLevelFilterApplied ? "filter-active" : ""}`}
                      onClick={() => setActiveDropdown(activeDropdown === "level" ? null : "level")}
                    >
                      ⌄
                    </span>
                  )}
                  {activeDropdown === "level" && (
                    <div ref={dropdownRef} className="filter-dropdown-menu">
                      <div className="filter-dropdown-scroll">
                        {getUniqueValues("level").map((lvl) => (
                          <label key={lvl} className="filter-dropdown-item">
                            <input
                              type="checkbox"
                              checked={selectedLevels.includes(lvl)}
                              onChange={() => handleToggleLevel(lvl)}
                            />
                            {lvl}
                          </label>
                        ))}
                      </div>
                      <button className="btn filter-apply-btn" onClick={applyLevelFilter}>
                        OK
                      </button>
                    </div>
                  )}
                </th>

                <th className={`filterable-th ${isFilterModeActive ? "with-padding" : ""}`}>
                  <span className="th-label" onClick={() => handleSort("schedule")}>
                    График работы {renderSortIcon("schedule")}
                  </span>
                  {isFilterModeActive && (
                    <span
                      className={`filter-trigger-btn ${isScheduleFilterApplied ? "filter-active" : ""}`}
                      onClick={() => setActiveDropdown(activeDropdown === "schedule" ? null : "schedule")}
                    >
                      ⌄
                    </span>
                  )}
                  {activeDropdown === "schedule" && (
                    <div ref={dropdownRef} className="filter-dropdown-menu">
                      <div className="filter-dropdown-scroll">
                        {getUniqueValues("schedule").map((sch) => (
                          <label key={sch} className="filter-dropdown-item">
                            <input
                              type="checkbox"
                              checked={selectedSchedules.includes(sch)}
                              onChange={() => handleToggleSchedule(sch)}
                            />
                            {sch}
                          </label>
                        ))}
                      </div>
                      <button className="btn filter-apply-btn" onClick={applyScheduleFilter}>
                        OK
                      </button>
                    </div>
                  )}
                </th>

                <th className={`filterable-th ${isFilterModeActive ? "with-padding" : ""}`}>
                  <span className="th-label" onClick={() => handleSort("workFormat")}>
                    Формат {renderSortIcon("workFormat")}
                  </span>
                  {isFilterModeActive && (
                    <span
                      className={`filter-trigger-btn ${isFormatFilterApplied ? "filter-active" : ""}`}
                      onClick={() => setActiveDropdown(activeDropdown === "workFormat" ? null : "workFormat")}
                    >
                      ⌄
                    </span>
                  )}
                  {activeDropdown === "workFormat" && (
                    <div ref={dropdownRef} className="filter-dropdown-menu">
                      <div className="filter-dropdown-scroll">
                        {getUniqueValues("workFormat").map((f) => (
                          <label key={f} className="filter-dropdown-item">
                            <input
                              type="checkbox"
                              checked={selectedFormats.includes(f)}
                              onChange={() => handleToggleFormat(f)}
                            />
                            {f}
                          </label>
                        ))}
                      </div>
                      <button className="btn filter-apply-btn" onClick={applyFormatFilter}>
                        OK
                      </button>
                    </div>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {processedItems.map((v) => (
                <tr
                  key={v.id}
                  className="clickable"
                  onClick={() => navigate(`/vacancies/${v.id}`)}
                >
                  <td>{v.title}</td>
                  <td>{v.level || "—"}</td>
                  <td>{v.schedule || "—"}</td>
                  <td>{v.workFormat || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}