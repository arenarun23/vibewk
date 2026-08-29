import type { CategorySummary } from "@/lib/types";

const BAR_COLORS = ["#3b5bdb", "#e8590c", "#2f9e44", "#f59f00", "#9775fa", "#495057"];

export default function CategoryBarChart({ data }: { data: CategorySummary[] }) {
  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-gray-400">기록이 없습니다</p>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {data.map((item, i) => (
        <div key={item.category} className="flex items-center gap-3">
          <span className="w-14 shrink-0 text-xs font-medium text-gray-600">{item.category}</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.max(item.ratio * 100, 2)}%`,
                backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
              }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-xs text-gray-500">
            {Math.round(item.ratio * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}
