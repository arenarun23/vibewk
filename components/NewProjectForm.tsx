"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Framework, SourceType } from "@/lib/types";
import type { FileInput } from "@/lib/validation";
import FileListEditor from "./FileListEditor";

export default function NewProjectForm() {
  const router = useRouter();
  const [sourceType, setSourceType] = useState<SourceType>("paste");
  const [name, setName] = useState("");
  const [framework, setFramework] = useState<Framework>("nextjs");
  const [existingRepoUrl, setExistingRepoUrl] = useState("");
  const [files, setFiles] = useState<FileInput[]>([{ path: "", content: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload =
      sourceType === "paste"
        ? { name, framework, hosting: "vercel", source_type: sourceType, files: files.filter((f) => f.path && f.content) }
        : { name, framework, hosting: "vercel", source_type: sourceType, existing_repo_url: existingRepoUrl };

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "프로젝트를 생성하지 못했습니다.");
      return;
    }

    const project = await res.json();
    router.push(`/projects/${project.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex gap-2">
        {(["paste", "existing_repo"] as SourceType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setSourceType(t)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              sourceType === t
                ? "border-[var(--brand)] bg-blue-50 text-[var(--brand)]"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            {t === "paste" ? "코드 붙여넣기" : "기존 GitHub 저장소 연결"}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-gray-700">
          프로젝트 이름
        </label>
        <input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="my-app (영문 소문자·숫자·하이픈)"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="framework" className="text-sm font-medium text-gray-700">
          프레임워크
        </label>
        <select
          id="framework"
          value={framework}
          onChange={(e) => setFramework(e.target.value as Framework)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-blue-100"
        >
          <option value="nextjs">Next.js</option>
          <option value="vite">Vite</option>
          <option value="sveltekit">SvelteKit</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">호스팅</span>
        <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
          Vercel (현재 유일하게 지원)
        </div>
      </div>

      {sourceType === "existing_repo" ? (
        <div className="flex flex-col gap-1">
          <label htmlFor="repo" className="text-sm font-medium text-gray-700">
            GitHub 저장소
          </label>
          <input
            id="repo"
            required
            value={existingRepoUrl}
            onChange={(e) => setExistingRepoUrl(e.target.value)}
            placeholder="owner/repo 또는 https://github.com/owner/repo"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-blue-100"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">
            파일 (다른 AI가 생성한 코드를 붙여넣으세요)
          </span>
          <FileListEditor files={files} onChange={setFiles} />
        </div>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "생성 중..." : "프로젝트 생성"}
      </button>
    </form>
  );
}
