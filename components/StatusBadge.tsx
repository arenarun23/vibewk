import { STATUS_LABELS, type ProjectStatus } from "@/lib/types";

const COLORS: Record<ProjectStatus, string> = {
  pending: "bg-gray-100 text-gray-600",
  building: "bg-amber-100 text-amber-700",
  live: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
