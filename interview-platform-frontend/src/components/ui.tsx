import type { ReactNode } from "react";
import type { CandidateStatus, InterviewStatus } from "../types";

export function Spinner({ label = "Загрузка…" }: { label?: string }) {
  return <div className="state"><div className="spinner" />{label}</div>;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="state empty">
      <div className="empty-title">{title}</div>
      {hint && <div className="empty-hint">{hint}</div>}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return <div className="state error">{message}</div>;
}

const STATUS_RU: Record<string, string> = {
  New: "Новый", InProgress: "В работе", Hired: "Оффер", Rejected: "Отказ",
  Planned: "Запланировано", Completed: "Проведено", Cancelled: "Отменено",
};
const STATUS_TONE: Record<string, string> = {
  New: "tone-blue", InProgress: "tone-amber", Hired: "tone-green", Rejected: "tone-red",
  Planned: "tone-blue", Completed: "tone-green", Cancelled: "tone-grey",
};

export function StatusBadge({ status }: { status: CandidateStatus | InterviewStatus | string }) {
  return <span className={"badge " + (STATUS_TONE[status] || "tone-grey")}>{STATUS_RU[status] || status}</span>;
}

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
      <div className="page-actions">{children}</div>
    </header>
  );
}

export function Pagination({ page, totalPages, onChange }:
  { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>Назад</button>
      <span className="page-info">Стр. {page} из {totalPages}</span>
      <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Вперёд</button>
    </div>
  );
}
