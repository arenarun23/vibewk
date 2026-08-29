-- 달력 가계부 (Calendar Ledger) — 시방서 §5 데이터 모델
-- Supabase SQL Editor 에서 그대로 실행하세요.

-- =========================================================
-- 1. profiles (사용자 프로필) — 시방서 §5-1
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  nickname text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- 2. categories — 시방서에는 없지만 FR-005(카테고리 관리)를
--    영속적으로 구현하기 위해 추가한 테이블. profiles/transactions와
--    동일한 RLS 패턴을 따른다.
-- =========================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- =========================================================
-- 3. transactions (거래 내역) — 시방서 §5-2
-- =========================================================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12, 2) not null check (amount > 0),
  category text not null default '기타',
  memo text,
  txn_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_month_idx
  on public.transactions (user_id, txn_date);

-- =========================================================
-- 4. RLS — 시방서 §5-3 그대로 적용 + categories 동일 패턴
-- =========================================================
alter table public.profiles     enable row level security;
alter table public.categories   enable row level security;
alter table public.transactions enable row level security;

-- profiles: 본인만 조회/수정 가능 (insert는 트리거가 처리)
create policy "본인만 조회" on public.profiles
  for select using (auth.uid() = id);
create policy "본인만 수정" on public.profiles
  for update using (auth.uid() = id);

-- categories: 본인만 CRUD
create policy "본인만 조회" on public.categories
  for select using (auth.uid() = user_id);
create policy "본인만 등록" on public.categories
  for insert with check (auth.uid() = user_id);
create policy "본인만 수정" on public.categories
  for update using (auth.uid() = user_id);
create policy "본인만 삭제" on public.categories
  for delete using (auth.uid() = user_id);

-- transactions: 본인만 CRUD
create policy "본인만 조회" on public.transactions
  for select using (auth.uid() = user_id);
create policy "본인만 등록" on public.transactions
  for insert with check (auth.uid() = user_id);
create policy "본인만 수정" on public.transactions
  for update using (auth.uid() = user_id);
create policy "본인만 삭제" on public.transactions
  for delete using (auth.uid() = user_id);

-- =========================================================
-- 5. 회원가입 트리거 — auth.users에 새 사용자가 생기면
--    profiles 행 생성 + 기본 카테고리 6종 시딩 (AC-005.1)
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nickname)
  values (new.id, new.email, new.raw_user_meta_data ->> 'nickname');

  insert into public.categories (user_id, name, is_default)
  values
    (new.id, '식비', true),
    (new.id, '교통', true),
    (new.id, '쇼핑', true),
    (new.id, '주거', true),
    (new.id, '문화', true),
    (new.id, '기타', true);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
