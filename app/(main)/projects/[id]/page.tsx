"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type { ProjectDetail } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import PipelineStepper from "@/components/PipelineStepper";

const POLL_MS = 3000;

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rollingBack, setRollingBack] = useState(false);
  const [rollbackError, setRollbackError] = useState<string | null>(null);
  const busy = useRef(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/projects/${id}`);
    if (res.ok) setDetail(await res.json());
    setLoading(false);
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 초기 상세 조회
    load();
  }, [load]);

  // 파이프라인 자동 진행: created → push, github_pushed → deploy, deploying → 폴링
  useEffect(() => {
    if (!detail || busy.current) return;
    const step = detail.pipeline?.current_step;

    async function advance(path: "push" | "deploy") {
      busy.current = true;
      await fetch(`/api/projects/${id}/${path}`, { method: "POST" });
      busy.current = false;
      load();
    }

    if (step === "created") {
      advance("push");
      return;
    }
    if (step === "github_pushed") {
      advance("deploy");
      return;
    }
    if (step === "deploying") {
      const t = setTimeout(load, POLL_MS);
      return () => clearTimeout(t);
    }
  }, [detail, id, load]);

  async function retry() {
    if (!detail) return;
    busy.current = true;
    const path = detail.project.repo_url ? "deploy" : "push";
    await fetch(`/api/projects/${id}/${path}`, { method: "POST" });
    busy.current = false;
    load();
  }

  async function rollback() {
    setRollingBack(true);
    setRollbackError(null);
    const res = await fetch(`/api/projects/${id}/rollback`, { method: "POST" });
    setRollingBack(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setRollbackError(body.error ?? "롤백에 실패했습니다.");
      return;
    }
    load();
  }

  if (loading) {
    return <p className="py-10 text-center text-sm text-gray-400">불러오는 중...</p>;
  }
  if (!detail) {
    return <p className="py-10 text-center text-sm text-gray-400">프로젝트를 찾을 수 없습니다.</p>;
  }

  const { project, pipeline, files, deployments } = detail;
  const step = pipeline?.current_step ?? "created";
  const hasReadyDeployment = deployments.some((d) => d.status === "ready");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">{project.name}</h1>
        <StatusBadge status={project.status} />
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <PipelineStepper current={step} />
      </section>

      {step === "failed" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">파이프라인이 중단되었습니다.</p>
          <p className="mt-1 whitespace-pre-wrap text-xs text-red-600">{pipeline?.last_error}</p>
          {rollbackError && <p className="mt-2 text-xs text-red-600">롤백 실패: {rollbackError}</p>}
          <div className="mt-3 flex gap-2">
            <button
              onClick={retry}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
            >
              재시도
            </button>
            {hasReadyDeployment && (
              <button
                onClick={rollback}
                disabled={rollingBack}
                className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                {rollingBack ? "롤백 중..." : "마지막 Ready로 롤백"}
              </button>
            )}
          </div>
        </div>
      )}

      {project.live_url && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">배포 완료</p>
          <a
            href={project.live_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block truncate text-sm text-[var(--brand)] underline"
          >
            {project.live_url}
          </a>
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-700">저장소</h2>
        {project.repo_url ? (
          <a
            href={project.repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--brand)] underline"
          >
            {project.repo_url}
          </a>
        ) : (
          <p className="text-sm text-gray-400">아직 저장소가 생성되지 않았습니다.</p>
        )}
      </section>

      {deployments.length > 0 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-gray-700">배포 이력</h2>
          <ul className="divide-y divide-gray-100">
            {deployments.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-500">{new Date(d.created_at).toLocaleString("ko-KR")}</span>
                <div className="flex items-center gap-3">
                  {d.log_url && (
                    <a
                      href={d.log_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--brand)] underline"
                    >
                      로그 보기
                    </a>
                  )}
                  <span className="font-medium text-gray-700">{d.status}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {project.source_type === "paste" && (
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-gray-700">파일 ({files.length})</h2>
          <ul className="flex flex-col gap-1 font-mono text-xs text-gray-600">
            {files.map((f) => (
              <li key={f.id}>{f.path}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
