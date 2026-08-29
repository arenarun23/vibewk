"use client";

import { useState } from "react";
import Link from "next/link";
import type { Transaction } from "@/lib/types";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

function formatWon(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

export default function TransactionList({
  transactions,
  onDeleted,
}: {
  transactions: Transaction[];
  onDeleted: (id: string) => void;
}) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    const res = await fetch(`/api/transactions/${pendingDeleteId}`, { method: "DELETE" });
    if (res.ok) {
      onDeleted(pendingDeleteId);
    }
    setPendingDeleteId(null);
  }

  if (transactions.length === 0) {
    return <p className="py-6 text-center text-sm text-gray-400">기록이 없습니다</p>;
  }

  return (
    <>
      <ul className="divide-y divide-gray-100">
        {transactions.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-800">
                {t.category}
                {t.memo ? <span className="ml-2 text-xs text-gray-400">{t.memo}</span> : null}
              </p>
              <p className="text-xs text-gray-400">{t.txn_date}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`text-sm font-semibold ${
                  t.type === "income" ? "text-[var(--income)]" : "text-[var(--expense)]"
                }`}
              >
                {t.type === "income" ? "+" : "-"}
                {formatWon(t.amount)}
              </span>
              <Link
                href={`/transactions/${t.id}`}
                className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
              >
                수정
              </Link>
              <button
                onClick={() => setPendingDeleteId(t.id)}
                className="rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50"
              >
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>

      <DeleteConfirmDialog
        open={pendingDeleteId !== null}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
