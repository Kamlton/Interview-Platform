export const INTERVIEW_DURATION_MS = 60 * 60 * 1000;
export const TIME_STEP_MINUTES = 30;
export const WORK_HOURS_START = 8;
export const WORK_HOURS_END = 20;

export function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function generateTimeSlots(stepMinutes = TIME_STEP_MINUTES): string[] {
  const slots: string[] = [];
  for (let h = WORK_HOURS_START; h < WORK_HOURS_END; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

export function combineDateAndTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

export function isTimeSlotBlocked(
  date: string,
  time: string,
  existingScheduledAt: string[],
): boolean {
  const start = combineDateAndTime(date, time).getTime();
  const end = start + INTERVIEW_DURATION_MS;

  return existingScheduledAt.some((iso) => {
    const existingStart = new Date(iso).getTime();
    const existingEnd = existingStart + INTERVIEW_DURATION_MS;
    return start < existingEnd && end > existingStart;
  });
}

export function getBlockedTimesForDate(
  date: string,
  existingScheduledAt: string[],
  stepMinutes = TIME_STEP_MINUTES,
): Set<string> {
  const blocked = new Set<string>();
  for (const time of generateTimeSlots(stepMinutes)) {
    if (isTimeSlotBlocked(date, time, existingScheduledAt)) {
      blocked.add(time);
    }
  }
  return blocked;
}

export function getScheduledTimesForDate(date: string, existingScheduledAt: string[]): string[] {
  return existingScheduledAt.filter((iso) => toLocalDateString(new Date(iso)) === date);
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

export { WEEKDAYS, MONTHS };

export function formatDisplayDate(date: string): string {
  if (!date) return "";
  const [y, m, d] = date.split("-").map(Number);
  return `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.${y}`;
}

export function getCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function parseDateParts(date: string): { year: number; month: number; day: number } | null {
  if (!date) return null;
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return null;
  return { year: y, month: m - 1, day: d };
}
