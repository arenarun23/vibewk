"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Project } from "@/lib/types";
import ProjectCard from "@/components/ProjectCard";

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Project[]) => setProjects(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">프로젝트</h1>
        <Link
          href="/projects/new"
          className="rounded-lg bg-[var(--brand)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + 신규 생성
        </Link>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">불러오는 중...</p>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-sm text-gray-500">아직 프로젝트가 없습니다.</p>
          <Link href="/projects/new" className="mt-2 inline-block text-sm font-medium text-[var(--brand)] hover:underline">
            첫 프로젝트 만들기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
