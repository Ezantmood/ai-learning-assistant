-- Migration: CN3 AI tom tat tai lieu (FR-14 -> FR-22)
-- Table: public.document_summaries (quan he 1-1 voi public.documents)
--
-- Idempotent: chay lai nhieu lan khong loi.
-- Cach chay: dan TOAN BO file vao Supabase Dashboard → SQL Editor → Run.
-- Khong chay tung doan roi rac (thieu policy se ho bao mat).
-- Khong dung supabase link / db push (access token sbp_ khong du quyen, xem DEVLOG G2).
-- Yeu cau chay truoc: 0001_account_manager.sql (ham set_updated_at) va
-- 0002_cn2_documents.sql (bang documents). File 0003 khong ton tai (CN2 xac nhan
-- khong can ban va, xem DEVLOG) nen file nay danh so 0004 theo dung thu tu.
-- Nguon su that DDL: file nay. docs/DATA-MODEL.md chi mo ta, lech thi sua theo file nay.
--
-- Quyet dinh CN3-SCHEMA (xem docs/SPEC.md muc CN3): bang rieng thay vi them cot
-- vao documents. Ly do: tach vong doi tom tat (tom tat lai chi UPDATE 1 row),
-- khong phinh documents (extracted_text cua CN2 giu cho CN4 hoi dap),
-- UNIQUE(document_id) dam bao 1-1, RLS doc lap theo user_id, xoa document
-- tu cascade xoa summary theo.

-- 1. Bang document_summaries ------------------------------------------------
-- user_id du thua co chu dich (denormalized) tu documents.user_id de RLS viet
-- truc tiep auth.uid() = user_id, khong can join/subquery trong policy.
create table if not exists public.document_summaries (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  summary_text text not null,
  model text not null default 'gemini-2.5-flash',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Constraints + FK (them neu chua co de chay lai an toan).
-- document_id SET khong cho doi sau khi tao o tang app; DB chi dam bao 1-1
-- va cascade, khong khoa UPDATE document_id (giua don gian, RLS WITH CHECK
-- tren user_id van giu cach ly du co doi document_id).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'document_summaries_document_unique'
  ) then
    alter table public.document_summaries
      add constraint document_summaries_document_unique unique (document_id);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'document_summaries_document_id_fkey'
  ) then
    alter table public.document_summaries
      add constraint document_summaries_document_id_fkey
      foreign key (document_id)
      references public.documents (id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'document_summaries_summary_rules'
  ) then
    alter table public.document_summaries
      add constraint document_summaries_summary_rules
      check (char_length(summary_text) between 1 and 20000);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'document_summaries_model_rules'
  ) then
    alter table public.document_summaries
      add constraint document_summaries_model_rules
      check (char_length(model) between 1 and 100);
  end if;
end
$$;

-- FR-18: liet ke ban tom tat theo user (khi can). Tim theo document dung
-- unique index co san cua document_summaries_document_unique, khong can index rieng.
create index if not exists document_summaries_user_idx
  on public.document_summaries (user_id);

-- 2. RLS --------------------------------------------------------------------
alter table public.document_summaries enable row level security;

drop policy if exists document_summaries_select_own on public.document_summaries;
create policy document_summaries_select_own
  on public.document_summaries for select
  using (auth.uid() = user_id);

drop policy if exists document_summaries_insert_own on public.document_summaries;
create policy document_summaries_insert_own
  on public.document_summaries for insert
  with check (auth.uid() = user_id);

drop policy if exists document_summaries_update_own on public.document_summaries;
create policy document_summaries_update_own
  on public.document_summaries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists document_summaries_delete_own on public.document_summaries;
create policy document_summaries_delete_own
  on public.document_summaries for delete
  using (auth.uid() = user_id);

-- Table grants (RLS policy chua du: role con can quyen bang).
-- authenticated: CRUD de RLS thu hep theo tung user.
-- service_role: full cho van hanh/admin (van can grant du bypass RLS).
-- anon: khong cap (bat buoc dang nhap).
grant select, insert, update, delete
  on public.document_summaries to authenticated;
grant all
  on public.document_summaries to service_role;
revoke all
  on public.document_summaries from anon;

-- 3. Trigger -----------------------------------------------------------------
-- Tai dung public.set_updated_at() co san tu 0001, KHONG tao function moi.
-- updated_at lam moc "processing treo": app coi processing co updated_at qua
-- 15 phut la chet giua chung va cho thu lai (xem docs/SPEC.md muc CN3).
drop trigger if exists set_document_summaries_updated_at on public.document_summaries;
create trigger set_document_summaries_updated_at
  before update on public.document_summaries
  for each row execute function public.set_updated_at();
