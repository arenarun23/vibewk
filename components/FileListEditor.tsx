"use client";

import type { FileInput } from "@/lib/validation";

export default function FileListEditor({
  files,
  onChange,
}: {
  files: FileInput[];
  onChange: (files: FileInput[]) => void;
}) {
  function updateFile(index: number, patch: Partial<FileInput>) {
    onChange(files.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function addFile() {
    onChange([...files, { path: "", content: "" }]);
  }

  function removeFile(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      {files.map((file, i) => (
        <div key={i} className="rounded-xl border border-gray-200 p-3">
          <div className="mb-2 flex items-center gap-2">
            <input
              value={file.path}
              onChange={(e) => updateFile(i, { path: e.target.value })}
              placeholder="app/page.tsx"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 font-mono text-xs outline-none focus:border-[var(--brand)]"
            />
            <button
              type="button"
              onClick={() => removeFile(i)}
              className="rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50"
            >
              삭제
            </button>
          </div>
          <textarea
            value={file.content}
            onChange={(e) => updateFile(i, { content: e.target.value })}
            placeholder="파일 내용을 붙여넣으세요"
            rows={6}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs outline-none focus:border-[var(--brand)]"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addFile}
        className="rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-[var(--brand)] hover:text-[var(--brand)]"
      >
        + 파일 추가
      </button>
    </div>
  );
}
