import { useEffect, useMemo, useRef, useState } from "react";
import type { InterviewStatus, Role, Vacancy } from "../types";
import { DateRangePicker, type DateRange } from "./DateRangePicker";

export interface InterviewFilterValues {
  vacancy: string;
  dateFrom: string;
  dateTo: string;
  interviewerRole: Role | "";
  status: InterviewStatus | "";
}

export const EMPTY_INTERVIEW_FILTERS: InterviewFilterValues = {
  vacancy: "",
  dateFrom: "",
  dateTo: "",
  interviewerRole: "",
  status: "",
};

const INTERVIEWER_OPTIONS: { value: Role | ""; label: string }[] = [
  { value: "", label: "Все" },
  { value: "Отдел кадров", label: "Отдел кадров (HR)" },
  { value: "Администратор", label: "Администратор" },
  { value: "Решала", label: "Решала" },
];

const STATUS_OPTIONS: { value: InterviewStatus | ""; label: string }[] = [
  { value: "", label: "Все" },
  { value: "Completed", label: "Проведено" },
  { value: "Planned", label: "Запланировано" },
];

export function hasActiveFilters(filters: InterviewFilterValues): boolean {
  return !!(filters.vacancy || filters.dateFrom || filters.dateTo
    || filters.interviewerRole || filters.status);
}

function toDateRange(dateFrom: string, dateTo: string): DateRange {
  return { from: dateFrom, to: dateTo };
}

function fromDateRange(range: DateRange): Pick<InterviewFilterValues, "dateFrom" | "dateTo"> {
  const dateFrom = range.from;
  const dateTo = range.to || range.from;
  return { dateFrom, dateTo: range.from ? dateTo : "" };
}

interface InterviewFiltersProps {
  filters: InterviewFilterValues;
  vacancies: Vacancy[];
  onApply: (filters: InterviewFilterValues) => void;
}

export function InterviewFilters({ filters, vacancies, onApply }: InterviewFiltersProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<InterviewFilterValues>(filters);
  const [vacancyOpen, setVacancyOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const vacancyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    if (!vacancyOpen) return;
    function onDocClick(e: MouseEvent) {
      if (vacancyRef.current && !vacancyRef.current.contains(e.target as Node)) setVacancyOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [vacancyOpen]);

  const vacancySuggestions = useMemo(() => {
    const q = draft.vacancy.trim().toLowerCase();
    if (!q) return vacancies.slice(0, 8);
    return vacancies.filter((v) => v.title.toLowerCase().includes(q)).slice(0, 8);
  }, [draft.vacancy, vacancies]);

  function reset() {
    setDraft(EMPTY_INTERVIEW_FILTERS);
  }

  function apply() {
    const normalized: InterviewFilterValues = {
      ...draft,
      vacancy: draft.vacancy.trim(),
      dateTo: draft.dateFrom && !draft.dateTo ? draft.dateFrom : draft.dateTo,
    };
    onApply(normalized);
    setOpen(false);
  }

  return (
    <div className="filter-wrap" ref={rootRef}>
      <button
        type="button"
        className={"btn btn-ghost btn-sm filter-btn" + (hasActiveFilters(filters) ? " filter-btn-active" : "")}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Фильтры"
        title="Фильтры"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M2 3.5h12M4.5 8h7M6.5 12.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="filter-popup" role="dialog" aria-label="Фильтрация собеседований">
          <div className="field">
            <label htmlFor="filter-vacancy">Вакансия</label>
            <div className="autocomplete" ref={vacancyRef}>
              <input
                id="filter-vacancy"
                className="input"
                placeholder="Название вакансии"
                value={draft.vacancy}
                onChange={(e) => { setDraft((d) => ({ ...d, vacancy: e.target.value })); setVacancyOpen(true); }}
                onFocus={() => setVacancyOpen(true)}
                autoComplete="off"
              />
              {vacancyOpen && vacancySuggestions.length > 0 && (
                <ul className="autocomplete-list" role="listbox">
                  {vacancySuggestions.map((v) => (
                    <li key={v.id}>
                      <button
                        type="button"
                        className="autocomplete-item"
                        onClick={() => {
                          setDraft((d) => ({ ...d, vacancy: v.title }));
                          setVacancyOpen(false);
                        }}
                      >
                        {v.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="field">
            <label>Дата</label>
            <DateRangePicker
              value={toDateRange(draft.dateFrom, draft.dateTo)}
              onChange={(range) => setDraft((d) => ({ ...d, ...fromDateRange(range) }))}
            />
          </div>

          <div className="field">
            <label htmlFor="filter-interviewer">Интервьюер</label>
            <select
              id="filter-interviewer"
              className="select"
              value={draft.interviewerRole}
              onChange={(e) => setDraft((d) => ({ ...d, interviewerRole: e.target.value as Role | "" }))}
            >
              {INTERVIEWER_OPTIONS.map((o) => (
                <option key={o.label} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="filter-status">Статус</label>
            <select
              id="filter-status"
              className="select"
              value={draft.status}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as InterviewStatus | "" }))}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.label} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>Сбросить</button>
            <button type="button" className="btn btn-sm" onClick={apply}>Применить</button>
          </div>
        </div>
      )}
    </div>
  );
}
