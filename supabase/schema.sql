-- VibeDeploy Hub MVP — 시방서 v3.1 §10 데이터 모델 (P0 핵심 파이프라인 범위로 축소)
-- Supabase SQL Editor 에서 그대로 실행하세요.
-- 이전 "달력 가계부" 스키마(profiles/categories/transactions)를 완전히 대체합니다.

drop table if exists public.audit_log cascade;
drop table if exists public.deployments cascade;
drop table if exists public.pipeline_state cascade;
drop table if exists public.project_files cascade;
drop table if exists public.projects cascade;
drop table if exists public.categories cascade;
drop table if exists public.transactions cascade;
drop table if exists public.profiles cascade;

-- =========================================================
-- 1. profiles — RBAC(12.5)용 role 컬럼만 최소 보유
-- =========================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- =========================================================
-- 2. projects — 시방서 §10.2 (FR-001/002), MVP 범위로 축소
--    source_type: 'paste'(코드 붙여넣기) | 'existing_repo'(기존 저장소 연결)
-- =========================================================
create table public.projects (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  name         text not null check (name ~ '^[a-z0-9-]{3,63}$'),
  framework    text not null check (framework in ('nextjs','vite','sveltekit')),
  hosting      text not null default 'vercel' check (hosting in ('vercel')),
  source_type  text not null check (source_type in ('paste','existing_repo')),
  repo_url     text,
  live_url     text,
  status       text not null default 'pending'
               check (status in ('pending','building','live','error','cancelled')),
  created_at   timestamptz not null default now()
);
create unique index projects_owner_name_uq on public.projects (owner_id, name);
create index projects_owner_created_idx on public.projects (owner_id, created_at desc);

-- =========================================================
-- 3. project_files — 'paste' 소스일 때만 사용 (FR-002/004)
-- =========================================================
create table public.project_files (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  path        text not null,
  content     text not null,
  created_at  timestamptz not null default now()
);
create unique index project_files_proj_path_uq on public.project_files (project_id, path);

-- =========================================================
-- 4. pipeline_state — SSOT (FR-005/011/013)
-- =========================================================
create table public.pipeline_state (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null unique references public.projects(id) on delete cascade,
  current_step    text not null default 'created'
                  check (current_step in ('created','security_gate','github_pushed','deploying','live','failed')),
  idempotency_key uuid not null default gen_random_uuid(),
  last_error      text,
  updated_at      timestamptz not null default now()
);

-- =========================================================
-- 5. deployments — 시방서 §10.2 (FR-006/011)
-- =========================================================
create table public.deployments (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  host            text not null default 'vercel',
  host_project_id text not null,
  commit_sha      text,
  status          text not null check (status in ('queued','building','ready','error')),
  url             text,
  log_url         text,
  created_at      timestamptz not null default now()
);
create index deployments_proj_created_idx on public.deployments (project_id, created_at desc);

-- =========================================================
-- 6. audit_log — 시방서 §10.5 (FR-015). MVP는 service_role 키를
--    아직 다루지 않으므로 INSERT는 본인 행만 허용하도록 완화하고,
--    조회/수정/삭제만 service_role 전용으로 유지한다.
-- =========================================================
create table public.audit_log (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.profiles(id),
  action       text not null,
  target_type  text not null,
  target_id    uuid,
  before_jsonb jsonb,
  after_jsonb  jsonb,
  ip           inet,
  created_at   timestamptz not null default now()
);

-- =========================================================
-- 7. RLS — 시방서 §10.3 owner 기반 4-정책 패턴
-- =========================================================
alter table public.profiles       enable row level security;
alter table public.projects       enable row level security;
alter table public.project_files  enable row level security;
alter table public.pipeline_state enable row level security;
alter table public.deployments    enable row level security;
alter table public.audit_log      enable row level security;

create policy "본인만 조회" on public.profiles for select using (auth.uid() = id);
create policy "본인만 수정" on public.profiles for update using (auth.uid() = id);

create policy "본인만 조회" on public.projects for select using (auth.uid() = owner_id);
create policy "본인만 등록" on public.projects for insert with check (auth.uid() = owner_id);
create policy "본인만 수정" on public.projects for update using (auth.uid() = owner_id);
create policy "본인만 삭제" on public.projects for delete using (auth.uid() = owner_id);

create policy "본인만 조회" on public.project_files for select
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy "본인만 등록" on public.project_files for insert
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy "본인만 삭제" on public.project_files for delete
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

create policy "본인만 조회" on public.pipeline_state for select
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy "본인만 등록" on public.pipeline_state for insert
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy "본인만 수정" on public.pipeline_state for update
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

create policy "본인만 조회" on public.deployments for select
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy "본인만 등록" on public.deployments for insert
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy "본인만 수정" on public.deployments for update
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

create policy "본인 행만 기록" on public.audit_log for insert with check (auth.uid() = actor_id);
create policy "service_role만 조회" on public.audit_log for select
  using (auth.jwt() ->> 'role' = 'service_role');
create policy "service_role만 수정" on public.audit_log for update
  using (auth.jwt() ->> 'role' = 'service_role');
create policy "service_role만 삭제" on public.audit_log for delete
  using (auth.jwt() ->> 'role' = 'service_role');

-- =========================================================
-- 8. 회원가입 트리거 — profiles 자동 생성
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
