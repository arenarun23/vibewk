import type { MonthSummary } from "@/lib/types";

function formatWon(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

export default function SummaryCards({ summary }: { summary: MonthSummary }) {
  const cards = [
    { label: "수입", value: summary.income, className: "text-[var(--income)]" },
    { label: "지출", value: summary.expense, className: "text-[var(--expense)]" },
    { label: "잔액", value: summary.balance, className: "text-gray-900" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-500">{c.label}</p>
          <p className={`mt-1 text-lg font-bold ${c.className}`}>{formatWon(c.value)}</p>
        </div>
      ))}
    </div>
  );
}
