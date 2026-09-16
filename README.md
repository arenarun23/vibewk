# VibeDeploy Hub

코드를 붙여넣거나 기존 GitHub 저장소를 연결하면 저장소 생성/push → Vercel 배포까지
자동으로 진행해주는 배포 파이프라인 도구입니다. 배포 로그 확인과 이전 배포로의
롤백 기능도 제공합니다. 자세한 요구사항은 `시방서_v3.1.html`을 참고하세요.

## 기술 스택

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Supabase (Postgres + Auth + RLS)
- GitHub API / Vercel API 연동

## 시작하기

```bash
npm install
npm run dev
```

`.env.local.example`을 참고해 `.env.local`을 채워야 로그인·DB·GitHub push·Vercel 배포
기능이 동작합니다. `GITHUB_TOKEN`/`VERCEL_TOKEN`이 없으면 push/deploy 단계가
"설정 필요" 오류로 안전하게 멈춥니다.

## DB 마이그레이션

Supabase SQL Editor에서 `supabase/schema.sql`을 실행합니다.

## 주요 경로

- `/login` `/signup` — 로그인·회원가입
- `/projects` — 내 프로젝트 목록
- `/projects/new` — 새 프로젝트 생성(코드 붙여넣기 또는 기존 저장소 연결)
- `/projects/[id]` — 프로젝트 상세(push/deploy 진행 상황, 배포 로그, 롤백)
