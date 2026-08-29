import Link from "next/link";
import type { Project } from "@/lib/types";
import { FRAMEWORK_LABELS } from "@/lib/types";
import StatusBadge from "./StatusBadge";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-[var(--brand)] hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="truncate font-semibold text-gray-900">{project.name}</h3>
        <StatusBadge status={project.status} />
      </div>
      <p className="mt-1 text-xs text-gray-500">
        {FRAMEWORK_LABELS[project.framework]} · {project.source_type === "paste" ? "코드 붙여넣기" : "기존 저장소"}
      </p>
      {project.live_url && (
        <p className="mt-2 truncate text-xs text-[var(--brand)]">{project.live_url}</p>
      )}
    </Link>
  );
}
