import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

// 클릭재킹·XSS 노출 완화용 보안 헤더 5종. 이 앱은 외부 폰트/이미지/iframe을
// 쓰지 않으므로(GitHub·Vercel API 호출은 서버 라우트에서만 일어남) CSP를
// storyroom보다 더 좁게 둔다.
const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  // 개발 모드에서는 Next.js Fast Refresh가 eval()을 쓴다 — 로컬 개발이
  // 깨지지 않도록 dev에서만 unsafe-eval 허용.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data:",
  // 개발 모드 HMR 웹소켓(ws://localhost:*)도 dev에서만 허용한다.
  `connect-src 'self' ${supabaseUrl}${isDev ? " ws://localhost:*" : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // x-powered-by: Next.js 헤더 노출 제거(정보 노출 최소화)
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
