import { useEffect, useRef, useState } from "react";
import type { CandidateStatus } from "../types";

export type CandidateSortDate = "newest" | "oldest";
export type CandidateSortName = "" | "asc" | "desc";

export interface CandidateFilterValues {
  city: string;
  status: CandidateStatus | "";
  sortDate: CandidateSortDate;
  sortName: CandidateSortName;
}

export const EMPTY_CANDIDATE_FILTERS: CandidateFilterValues = {
  city: "",
  status: "",
  sortDate: "newest",
  sortName: "",
};

const STATUS_OPTIONS: { value: CandidateStatus | ""; label: string }[] = [
  { value: "", label: "Все" },
  { value: "New", label: "Новый" },
  { value: "Hired", label: "Оффер" },
  { value: "Rejected", label: "Отказ" },
];

const SORT_DATE_OPTIONS: { value: CandidateSortDate; label: string }[] = [
  { value: "newest", label: "Сначала новые" },
  { value: "oldest", label: "Сначала давние" },
];

const SORT_NAME_OPTIONS: { value: CandidateSortName; label: string }[] = [
  { value: "", label: "Без сортировки" },
  { value: "asc", label: "А → Я" },
  { value: "desc", label: "Я → А" },
];

export function hasActiveCandidateFilters(filters: CandidateFilterValues): boolean {
  return !!(filters.city || filters.status
    || filters.sortDate !== "newest" || filters.sortName);
}

interface CandidateFiltersProps {
  filters: CandidateFilterValues;
  onApply: (filters: CandidateFilterValues) => void;
}

export function CandidateFilters({ filters, onApply }: CandidateFiltersProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<CandidateFilterValues>(filters);
  const rootRef = useRef<HTMLDivElement>(null);

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

  function reset() {
    setDraft(EMPTY_CANDIDATE_FILTERS);
  }

  function apply() {
    onApply({ ...draft, city: draft.city.trim() });
    setOpen(false);
  }

  return (
    <div className="filter-wrap" ref={rootRef}>
      <button
        type="button"
        className={"btn btn-ghost btn-sm filter-btn" + (hasActiveCandidateFilters(filters) ? " filter-btn-active" : "")}
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
        <div className="filter-popup" role="dialog" aria-label="Фильтрация кандидатов">
          <div className="field">
            <label htmlFor="filter-city">Город</label>
            <input
              id="filter-city"
              className="input"
              placeholder="Все"
              value={draft.city}
              onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
            />
          </div>

          <div className="field">
            <label htmlFor="filter-candidate-status">Статус</label>
            <select
              id="filter-candidate-status"
              className="select"
              value={draft.status}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as CandidateStatus | "" }))}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.label} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="filter-sort-date">Сортировка по дате</label>
            <select
              id="filter-sort-date"
              className="select"
              value={draft.sortDate}
              onChange={(e) => setDraft((d) => ({ ...d, sortDate: e.target.value as CandidateSortDate }))}
            >
              {SORT_DATE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="filter-sort-name">Сортировка по ФИО</label>
            <select
              id="filter-sort-name"
              className="select"
              value={draft.sortName}
              onChange={(e) => setDraft((d) => ({ ...d, sortName: e.target.value as CandidateSortName }))}
            >
              {SORT_NAME_OPTIONS.map((o) => (
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
