"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatDateISO } from "@/lib/date";
import type { Transaction, TransactionType } from "@/lib/types";

interface TransactionFormProps {
  transaction?: Transaction;
  defaultDate?: string;
}

export default function TransactionForm({ transaction, defaultDate }: TransactionFormProps) {
  const router = useRouter();
  const isEdit = Boolean(transaction);

  const [type, setType] = useState<TransactionType>(transaction?.type ?? "expense");
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : "");
  const [txnDate, setTxnDate] = useState(
    transaction?.txn_date ?? defaultDate ?? formatDateISO(new Date()),
  );
  const [category, setCategory] = useState(transaction?.category ?? "");
  const [memo, setMemo] = useState(transaction?.memo ?? "");
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("categories")
      .select("name")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        const names = (data ?? []).map((c) => c.name as string);
        setCategories(names);
        if (!category && names.length > 0) {
          setCategory(names[0]);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      type,
      amount: Number(amount),
      category,
      memo: memo || null,
      txn_date: txnDate,
    };

    setLoading(true);
    const res = await fetch(
      isEdit ? `/api/transactions/${transaction!.id}` : "/api/transactions",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "저장하지 못했습니다.");
      return;
    }

    router.push("/calendar");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex gap-2">
        {(["expense", "income"] as TransactionType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              type === t
                ? t === "income"
                  ? "border-[var(--income)] bg-green-50 text-[var(--income)]"
                  : "border-[var(--expense)] bg-red-50 text-[var(--expense)]"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            {t === "income" ? "수입" : "지출"}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="amount" className="text-sm font-medium text-gray-700">
          금액
        </label>
        <input
          id="amount"
          type="number"
          required
          min={1}
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-blue-100"
          placeholder="0"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="txn_date" className="text-sm font-medium text-gray-700">
          날짜
        </label>
        <input
          id="txn_date"
          type="date"
          required
          value={txnDate}
          onChange={(e) => setTxnDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="category" className="text-sm font-medium text-gray-700">
          카테고리
        </label>
        <select
          id="category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-blue-100"
        >
          {categories.length === 0 && <option value="">카테고리 없음</option>}
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="memo" className="text-sm font-medium text-gray-700">
          메모
        </label>
        <input
          id="memo"
          type="text"
          value={memo ?? ""}
          onChange={(e) => setMemo(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-blue-100"
          placeholder="선택 입력"
        />
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}
