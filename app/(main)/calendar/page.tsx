"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDateISO, formatMonthKey, monthLabel } from "@/lib/date";
import type { Transaction } from "@/lib/types";
import CalendarGrid from "@/components/CalendarGrid";
import TransactionList from "@/components/TransactionList";

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const monthKey = formatMonthKey(year, month);

  useEffect(() => {
    fetch(`/api/transactions?month=${monthKey}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Transaction[]) => setTransactions(data))
      .finally(() => setLoading(false));
  }, [monthKey]);

  function shiftMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  const selectedIso = formatDateISO(selectedDate);
  const dayTransactions = transactions.filter((t) => t.txn_date === selectedIso);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftMonth(-1)}
            className="rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-100"
            aria-label="이전 달"
          >
            ‹
          </button>
          <h1 className="text-lg font-bold text-gray-900">{monthLabel(year, month)}</h1>
          <button
            onClick={() => shiftMonth(1)}
            className="rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-100"
            aria-label="다음 달"
          >
            ›
          </button>
        </div>
        <Link
          href={`/transactions/new?date=${selectedIso}`}
          className="rounded-lg bg-[var(--brand)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + 거래 등록
        </Link>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : (
        <CalendarGrid
          year={year}
          month={month}
          transactions={transactions}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="mb-1 text-sm font-semibold text-gray-700">{selectedIso} 거래 목록</h2>
        <TransactionList
          transactions={dayTransactions}
          onDeleted={(id) => setTransactions((prev) => prev.filter((t) => t.id !== id))}
        />
      </section>
    </div>
  );
}
