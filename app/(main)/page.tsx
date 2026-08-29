"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatMonthKey, monthLabel } from "@/lib/date";
import type { MonthSummary, Transaction } from "@/lib/types";
import SummaryCards from "@/components/SummaryCards";
import CategoryBarChart from "@/components/CategoryBarChart";
import TransactionList from "@/components/TransactionList";

const EMPTY_SUMMARY: MonthSummary = { income: 0, expense: 0, balance: 0, byCategory: [] };

export default function HomePage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [summary, setSummary] = useState<MonthSummary>(EMPTY_SUMMARY);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const monthKey = formatMonthKey(year, month);

  async function load() {
    const [summaryRes, txnRes] = await Promise.all([
      fetch(`/api/summary?month=${monthKey}`),
      fetch(`/api/transactions?month=${monthKey}`),
    ]);
    setSummary(summaryRes.ok ? await summaryRes.json() : EMPTY_SUMMARY);
    const txns: Transaction[] = txnRes.ok ? await txnRes.json() : [];
    setRecent([...txns].sort((a, b) => b.txn_date.localeCompare(a.txn_date)).slice(0, 8));
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 데이터 fetch 후 상태 반영 (일반적인 로딩 패턴)
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey]);

  function shiftMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftMonth(-1)}
            className="rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-100"
            aria-label="이전 달"
          >
            ‹
          </button>
          <h1 className="text-lg font-bold text-gray-900">{monthLabel(year, month)} 요약</h1>
          <button
            onClick={() => shiftMonth(1)}
            className="rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-100"
            aria-label="다음 달"
          >
            ›
          </button>
        </div>
        <Link
          href="/transactions/new"
          className="rounded-lg bg-[var(--brand)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + 거래 등록
        </Link>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : (
        <>
          <SummaryCards summary={summary} />

          <section className="rounded-2xl border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-700">카테고리별 지출 비중</h2>
            <CategoryBarChart data={summary.byCategory} />
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-4">
            <h2 className="mb-1 text-sm font-semibold text-gray-700">최근 거래</h2>
            <TransactionList transactions={recent} onDeleted={() => load()} />
          </section>
        </>
      )}
    </div>
  );
}
