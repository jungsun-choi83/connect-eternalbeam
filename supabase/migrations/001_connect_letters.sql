-- Supabase SQL Editor에서 실행하거나 CLI로 적용하세요.
-- 서버(Express)는 SUPABASE_SERVICE_ROLE_KEY로 삽입·조회합니다(RLS는 anon 차단 권장).

create table if not exists public.connect_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  user_email text not null,
  letter_content text not null,
  device_id text null,
  created_at timestamptz not null default now()
);

create index if not exists connect_letters_email_lower_idx on public.connect_letters (lower(user_email));
create index if not exists connect_letters_device_id_idx on public.connect_letters (device_id)
  where device_id is not null;
create index if not exists connect_letters_created_at_idx on public.connect_letters (created_at desc);

alter table public.connect_letters enable row level security;

-- 클라이언트 직접 접근 없음 — 서버(service role)만 사용
-- 필요 시 anon 정책은 추가하지 마세요(스팸 위험).

comment on table public.connect_letters is '이터널 커넥트: 소울트레이스에서 넘어온 편지(이메일 매칭)';
