"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { FALLBACK_CATEGORY, type Category } from "@/lib/types";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  async function loadCategories() {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: true });
    setCategories((data ?? []) as Category[]);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 데이터 fetch 후 상태 반영 (일반적인 로딩 패턴)
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const name = newName.trim();
    if (!name) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error: insertError } = await supabase
      .from("categories")
      .insert({ user_id: user.id, name, is_default: false });

    if (insertError) {
      setError(insertError.message.includes("duplicate") ? "이미 있는 카테고리입니다." : "카테고리를 추가하지 못했습니다.");
      return;
    }

    setNewName("");
    loadCategories();
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);

    // 해당 카테고리의 기존 거래를 '기타'로 이동 (AC-005.4)
    await supabase
      .from("transactions")
      .update({ category: FALLBACK_CATEGORY })
      .eq("category", target.name);

    await supabase.from("categories").delete().eq("id", target.id);

    loadCategories();
  }

  if (loading) {
    return <p className="text-sm text-gray-400">불러오는 중...</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="새 카테고리 이름"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="submit"
          className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          추가
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between px-4 py-2.5">
            <span className="text-sm text-gray-800">{c.name}</span>
            {c.name !== FALLBACK_CATEGORY && (
              <button
                onClick={() => setPendingDelete(c)}
                className="rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50"
              >
                삭제
              </button>
            )}
          </li>
        ))}
      </ul>

      <DeleteConfirmDialog
        open={pendingDelete !== null}
        message={`'${pendingDelete?.name}' 카테고리를 삭제할까요? 기존 거래는 '기타'로 이동합니다.`}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
