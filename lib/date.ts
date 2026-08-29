function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function formatMonthKey(year: number, month: number) {
  // month: 0-11
  return `${year}-${pad(month + 1)}`;
}

export function formatDateISO(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(date: Date) {
  return isSameDay(date, new Date());
}

/** 월~일 6주 그리드 (앞뒤 달 날짜 포함) */
export function getMonthGridDays(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  // getDay(): 0=일 ... 6=토. 월요일 시작 그리드를 위해 보정.
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // 0=월 ... 6=일
  const start = new Date(year, month, 1 - firstWeekday);

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

export function monthLabel(year: number, month: number) {
  return `${year}년 ${month + 1}월`;
}
