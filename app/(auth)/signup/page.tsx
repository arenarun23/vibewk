"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { mapAuthErrorToKorean, validatePassword } from "@/lib/validation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const pwError = validatePassword(password);
    if (pwError) {
      setError(pwError);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      setLoading(false);
      setError(mapAuthErrorToKorean(signUpError.message));
      return;
    }

    // Supabase 프로젝트에서 "Confirm email"이 꺼져 있으면 세션이 바로 발급되어
    // 자동 로그인된다 (AC-1.1). 켜져 있으면 이메일 인증 안내로 대체된다.
    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    setLoading(false);
    setError("가입 확인 메일을 보냈습니다. 메일함을 확인한 뒤 로그인해 주세요.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-[var(--brand)]">회원가입</h1>
        <p className="mb-6 text-sm text-gray-500">VibeDeploy Hub를 시작해 보세요</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              이메일
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-blue-100"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-blue-100"
              placeholder="8자 이상, 영문+숫자"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-medium text-[var(--brand)] hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
