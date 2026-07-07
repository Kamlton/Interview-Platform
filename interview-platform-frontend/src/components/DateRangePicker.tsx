import { useEffect, useRef, useState } from "react";
import {
  MONTHS, WEEKDAYS, formatDisplayDate, getCalendarDays,
  parseDateParts, toLocalDateString,
} from "../utils/interviewSchedule";

export interface DateRange {
  from: string;
  to: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatRangeLabel(value: DateRange): string {
  if (!value.from) return "Выберите дату";
  if (!value.to || value.from === value.to) return formatDisplayDate(value.from);
  return `${formatDisplayDate(value.from)} — ${formatDisplayDate(value.to)}`;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const today = toLocalDateString(new Date());
  const parsed = parseDateParts(value.from) ?? parseDateParts(today)!;

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed.year);
  const [viewMonth, setViewMonth] = useState(parsed.month);
  const [pickingEnd, setPickingEnd] = useState(false);
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
    const p = parseDateParts(value.from);
    if (p) {
      setViewYear(p.year);
      setViewMonth(p.month);
    }
  }, [value.from]);

  function selectDay(day: number) {
    const date = toDateStr(viewYear, viewMonth, day);
    if (!pickingEnd || !value.from) {
      onChange({ from: date, to: "" });
      setPickingEnd(true);
      return;
    }
    if (date < value.from) {
      onChange({ from: date, to: "" });
      setPickingEnd(true);
      return;
    }
    onChange({ from: value.from, to: date });
    setPickingEnd(false);
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

  function openPicker() {
    setPickingEnd(!!value.from && !value.to);
    setOpen((o) => !o);
  }

  const cells = getCalendarDays(viewYear, viewMonth);
  const rangeEnd = value.to || (pickingEnd ? "" : value.from);

  return (
    <div className="picker" ref={rootRef}>
      <button
        type="button"
        className={"picker-trigger input" + (value.from ? "" : " picker-placeholder")}
        onClick={openPicker}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {formatRangeLabel(value)}
      </button>

      {open && (
        <div className="picker-popup calendar" role="dialog" aria-label="Выбор даты">
          <div className="calendar-header">
            <button type="button" className="calendar-nav" onClick={prevMonth} aria-label="Предыдущий месяц">‹</button>
            <span className="calendar-title">{MONTHS[viewMonth]} {viewYear}</span>
            <button type="button" className="calendar-nav" onClick={nextMonth} aria-label="Следующий месяц">›</button>
          </div>
          {value.from && !value.to && (
            <div className="calendar-hint">Выберите конец диапазона или примените фильтр с одной датой</div>
          )}
          <div className="calendar-weekdays">
            {WEEKDAYS.map((d) => <span key={d} className="calendar-weekday">{d}</span>)}
          </div>
          <div className="calendar-grid">
            {cells.map((day, i) => {
              if (day === null) return <span key={`e-${i}`} className="calendar-cell empty" />;
              const dateStr = toDateStr(viewYear, viewMonth, day);
              const selected = value.from === dateStr || value.to === dateStr;
              const inRange = value.from && rangeEnd && dateStr > value.from && dateStr < rangeEnd;
              const isToday = dateStr === today;
              return (
                <button
                  key={dateStr}
                  type="button"
                  className={"calendar-cell"
                    + (selected ? " selected" : "")
                    + (inRange ? " in-range" : "")
                    + (isToday ? " today" : "")}
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
