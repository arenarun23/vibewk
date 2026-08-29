"use client";

import { getMonthGridDays, isSameDay, isToday, WEEKDAY_LABELS } from "@/lib/date";
import type { Transaction } from "@/lib/types";

function formatWon(n: number) {
  if (n >= 10000) return `${Math.round(n / 1000) / 10}만`;
  return n.toLocaleString("ko-KR");
}

export default function CalendarGrid({
  year,
  month,
  transactions,
  selectedDate,
  onSelectDate,
}: {
  year: number;
  month: number;
  transactions: Transaction[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}) {
  const days = getMonthGridDays(year, month);

  const expenseByDay = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    expenseByDay.set(t.txn_date, (expenseByDay.get(t.txn_date) ?? 0) + t.amount);
  }

  return (
    <div>
      <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-400">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="py-2">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const inMonth = d.getMonth() === month;
          const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
            d.getDate(),
          ).padStart(2, "0")}`;
          const expense = expenseByDay.get(iso);
          const selected = selectedDate ? isSameDay(d, selectedDate) : false;
          const today = isToday(d);

          return (
            <button
              key={iso}
              onClick={() => onSelectDate(d)}
              className={`flex h-16 flex-col items-center justify-start rounded-lg border p-1 text-left transition ${
                selected
                  ? "border-[var(--brand)] bg-blue-50"
                  : "border-transparent hover:bg-gray-50"
              } ${inMonth ? "" : "opacity-35"}`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  today ? "bg-[var(--brand)] font-semibold text-white" : "text-gray-700"
                }`}
              >
                {d.getDate()}
              </span>
              {expense ? (
                <span className="mt-1 text-[10px] font-medium text-[var(--expense)]">
                  -{formatWon(expense)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
