import { useEffect, useRef, useState } from "react";
import {
  MONTHS, WEEKDAYS, formatDisplayDate, getCalendarDays,
  parseDateParts, toLocalDateString,
} from "../utils/interviewSchedule";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minDate?: string;
}

export function DatePicker({ value, onChange, required, minDate }: DatePickerProps) {
  const today = toLocalDateString(new Date());
  const min = minDate ?? today;
  const parsed = parseDateParts(value);
  const initial = parsed ?? parseDateParts(min)!;

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
  }, [value]);

  function selectDay(day: number) {
    const date = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (date < min) return;
    onChange(date);
    setOpen(false);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  const cells = getCalendarDays(viewYear, viewMonth);

  return (
    <div className="picker" ref={rootRef}>
      <button
        type="button"
        className={"picker-trigger input" + (value ? "" : " picker-placeholder")}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {value ? formatDisplayDate(value) : "Выберите дату"}
      </button>
      <input type="hidden" value={value} required={required} readOnly tabIndex={-1} aria-hidden />

      {open && (
        <div className="picker-popup calendar" role="dialog" aria-label="Выбор даты">
          <div className="calendar-header">
            <button type="button" className="calendar-nav" onClick={prevMonth} aria-label="Предыдущий месяц">‹</button>
            <span className="calendar-title">{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" className="calendar-nav" onClick={nextMonth} aria-label="Следующий месяц">›</button>
          </div>
          <div className="calendar-weekdays">
            {WEEKDAYS.map((d) => <span key={d} className="calendar-weekday">{d}</span>)}
          </div>
          <div className="calendar-grid">
            {cells.map((day, i) => {
              if (day === null) return <span key={`e-${i}`} className="calendar-cell empty" />;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const disabled = dateStr < min;
              const selected = value === dateStr;
              const isToday = dateStr === today;
              return (
                <button
                  key={dateStr}
                  type="button"
                  className={"calendar-cell" + (selected ? " selected" : "") + (isToday ? " today" : "") + (disabled ? " disabled" : "")}
                  disabled={disabled}
                  onClick={() => selectDay(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
