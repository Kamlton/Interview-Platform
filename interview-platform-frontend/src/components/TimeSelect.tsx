import { useEffect, useRef, useState } from "react";
import { generateTimeSlots } from "../utils/interviewSchedule";

interface TimeSelectProps {
  value: string;
  onChange: (value: string) => void;
  blockedTimes?: Set<string>;
  required?: boolean;
  disabled?: boolean;
}

export function TimeSelect({ value, onChange, blockedTimes, required, disabled }: TimeSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const slots = generateTimeSlots();

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const availableCount = slots.filter((t) => !blockedTimes?.has(t)).length;

  return (
    <div className="picker" ref={rootRef}>
      <button
        type="button"
        className={"picker-trigger input" + (value ? "" : " picker-placeholder")}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {value || (disabled ? "Сначала выберите дату" : "Выберите время")}
      </button>
      <input type="hidden" value={value} required={required} readOnly tabIndex={-1} aria-hidden />

      {open && (
        <ul className="picker-popup time-list" role="listbox" aria-label="Выбор времени">
          {slots.map((time) => {
            const blocked = blockedTimes?.has(time) ?? false;
            const selected = value === time;
            return (
              <li key={time} role="option" aria-selected={selected} aria-disabled={blocked}>
                <button
                  type="button"
                  className={"time-option" + (selected ? " selected" : "") + (blocked ? " blocked" : "")}
                  disabled={blocked}
                  title={blocked ? "Время занято (конфликт по вакансии или расписанию кандидата)" : undefined}
                  onClick={() => { onChange(time); setOpen(false); }}
                >
                  {time}
                  {blocked && <span className="time-option-hint">занято</span>}
                </button>
              </li>
            );
          })}
          {availableCount === 0 && (
            <li className="time-list-empty">На эту дату нет свободных слотов</li>
          )}
        </ul>
      )}
    </div>
  );
}
