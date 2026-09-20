-- Migration: CN4 AI hoi dap tren tai lieu (FR-23 -> FR-30)
-- Table: public.document_questions (lich su hoi dap append-only theo tung tai lieu)
--
-- Idempotent: chay lai nhieu lan khong loi.
-- Cach chay: dan TOAN BO file vao Supabase Dashboard → SQL Editor → Run.
-- Khong chay tung doan roi rac (thieu policy se ho bao mat).
-- Khong dung supabase link / db push (access token sbp_ khong du quyen, xem DEVLOG G2).
-- Yeu cau chay truoc: 0002_cn2_documents.sql (bang documents) va
-- 0004_cn3_summaries.sql (mau RLS + trigger set_updated_at).
-- Nguon su that DDL: file nay. docs/DATA-MODEL.md chi mo ta, lech thi sua theo file nay.
--
-- Quyet dinh CN4-HISTORY (SPEC goc khong co noi dung FR-23->FR-30, lenh session
-- cn3g2-cn4 la spec tam): lich su la append-only theo tung tai lieu, moi nhat
-- truoc; luot hoi loi KHONG tao row; khong sua/xoa tung cau (ngoai de).
-- Cau hoi toi da 500 ky tu (giu prompt gon, do dot quota); cau tra loi toi da
-- 20.000 ky tu (cung nguong ban tom tat CN3). Model mac dinh 'gemini-3.5-flash'
-- theo app tu CN3-G1.

-- 1. Bang document_questions -----------------------------------------------
-- user_id du thua co chu dich (denormalized) tu documents.user_id de RLS viet
-- truc tiep auth.uid() = user_id, khong can join/subquery trong policy.
create table if not exists public.document_questions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  question text not null,
  answer text not null,
  model text not null default 'gemini-3.5-flash',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Constraints + FK (them neu chua co de chay lai an toan).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'document_questions_document_id_fkey'
  ) then
    alter table public.document_questions
      add constraint document_questions_document_id_fkey
      foreign key (document_id)
      references public.documents (id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'document_questions_qa_rules'
  ) then
    alter table public.document_questions
      add constraint document_questions_qa_rules
      check (
        char_length(question) between 1 and 500
        and char_length(answer) between 1 and 20000
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'document_questions_model_rules'
  ) then
    alter table public.document_questions
      add constraint document_questions_model_rules
      check (char_length(model) between 1 and 100);
  end if;
end
$$;

-- FR lich su: liet ke theo tai lieu, moi nhat truoc.
create index if not exists document_questions_doc_created_idx
  on public.document_questions (document_id, created_at desc);

-- 2. RLS --------------------------------------------------------------------
alter table public.document_questions enable row level security;

drop policy if exists document_questions_select_own on public.document_questions;
create policy document_questions_select_own
  on public.document_questions for select
  using (auth.uid() = user_id);

drop policy if exists document_questions_insert_own on public.document_questions;
create policy document_questions_insert_own
  on public.document_questions for insert
  with check (auth.uid() = user_id);

drop policy if exists document_questions_update_own on public.document_questions;
create policy document_questions_update_own
  on public.document_questions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists document_questions_delete_own on public.document_questions;
create policy document_questions_delete_own
  on public.document_questions for delete
  using (auth.uid() = user_id);

-- Table grants (RLS policy chua du: role con can quyen bang).
-- authenticated: CRUD de RLS thu hep theo tung user.
-- service_role: full cho van hanh/admin (van can grant du bypass RLS).
-- anon: khong cap (bat buoc dang nhap).
grant select, insert, update, delete
  on public.document_questions to authenticated;
grant all
  on public.document_questions to service_role;
revoke all
  on public.document_questions from anon;

-- 3. Trigger -----------------------------------------------------------------
-- Tai dung public.set_updated_at() co san tu 0001, KHONG tao function moi.
drop trigger if exists set_document_questions_updated_at on public.document_questions;
create trigger set_document_questions_updated_at
  before update on public.document_questions
  for each row execute function public.set_updated_at();
