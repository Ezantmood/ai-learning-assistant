-- Migration: CN6 AI goi y loi giai (FR-38 -> FR-45)
-- Table: public.document_solutions (goi y loi giai 1-1 theo tung tai lieu)
--
-- Idempotent: chay lai nhieu lan khong loi.
-- Cach chay: dan TOAN BO file vao Supabase Dashboard → SQL Editor → Run.
-- Khong chay tung doan roi rac (thieu policy se ho bao mat).
-- Khong dung supabase link / db push (PAT sbp_ khong du quyen ghi, xem DEVLOG G2).
-- Yeu cau chay truoc: 0002_cn2_documents.sql (bang documents de FK CASCADE)
-- va 0001_account_manager.sql (ham set_updated_at). Mau RLS + trigger theo
-- 0004_cn3_summaries.sql / 0005_cn4_questions.sql.
-- Nguon su that DDL: file nay. docs/DATA-MODEL.md chi mo ta, lech thi sua theo file nay.
--
-- Quyet dinh CN6-SCHEMA (xem docs/SPEC.md muc CN6): bang rieng thay vi tai
-- dung bang cu. Ly do: document_summaries la ban tom tat 1-1 (ghi de la mat
-- tom tat); document_questions la lich su hoi dap append-only (nhet goi y
-- vao la tron lich su); documents khong con cot trang thai trong (lat
-- extraction_status dang 'done' la pha ngu nghia CN3/CN5, va CHECK cu chi co
-- dung 5 gia tri pending/processing/done/failed/unsupported — CAM bia moi).
-- Goi y lai = UPDATE cung row theo UNIQUE(document_id), khong sua/xoa tung ban.
-- Goi y toi da 20.000 ky tu (cung nguong ban tom tat CN3 va cau tra loi CN4).
-- Model mac dinh 'gemini-3.5-flash' theo app tu CN3-G1.
--
-- KHONG dung cot extraction_status cua documents, KHONG them gia tri status
-- moi, KHONG sua bang/cot/policy hien co.

-- 1. Bang document_solutions ----------------------------------------------
-- user_id du thua co chu dich (denormalized) tu documents.user_id de RLS viet
-- truc tiep auth.uid() = user_id, khong can join/subquery trong policy.
create table if not exists public.document_solutions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  solution_text text not null,
  model text not null default 'gemini-3.5-flash',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Constraints + FK (them neu chua co de chay lai an toan).
-- document_id SET khong cho doi sau khi tao o tang app; DB chi dam bao 1-1
-- va cascade, khong khoa UPDATE document_id (giua don gian, RLS WITH CHECK
-- tren user_id van giu cach ly du co doi document_id) — giong 0004/0005.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'document_solutions_document_unique'
  ) then
    alter table public.document_solutions
      add constraint document_solutions_document_unique unique (document_id);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'document_solutions_document_id_fkey'
  ) then
    alter table public.document_solutions
      add constraint document_solutions_document_id_fkey
      foreign key (document_id)
      references public.documents (id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'document_solutions_solution_rules'
  ) then
    alter table public.document_solutions
      add constraint document_solutions_solution_rules
      check (char_length(solution_text) between 1 and 20000);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'document_solutions_model_rules'
  ) then
    alter table public.document_solutions
      add constraint document_solutions_model_rules
      check (char_length(model) between 1 and 100);
  end if;
end
$$;

-- FR-42: liet ke goi y theo user (khi can). Tim theo document dung
-- unique index co san cua document_solutions_document_unique, khong can index rieng.
create index if not exists document_solutions_user_idx
  on public.document_solutions (user_id);

-- 2. RLS --------------------------------------------------------------------
alter table public.document_solutions enable row level security;

drop policy if exists document_solutions_select_own on public.document_solutions;
create policy document_solutions_select_own
  on public.document_solutions for select
  using (auth.uid() = user_id);

drop policy if exists document_solutions_insert_own on public.document_solutions;
create policy document_solutions_insert_own
  on public.document_solutions for insert
  with check (auth.uid() = user_id);

drop policy if exists document_solutions_update_own on public.document_solutions;
create policy document_solutions_update_own
  on public.document_solutions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists document_solutions_delete_own on public.document_solutions;
create policy document_solutions_delete_own
  on public.document_solutions for delete
  using (auth.uid() = user_id);

-- Table grants (RLS policy chua du: role con can quyen bang).
-- authenticated: CRUD de RLS thu hep theo tung user.
-- service_role: full cho van hanh/admin (van can grant du bypass RLS).
-- anon: khong cap (bat buoc dang nhap).
grant select, insert, update, delete
  on public.document_solutions to authenticated;
grant all
  on public.document_solutions to service_role;
revoke all
  on public.document_solutions from anon;

-- 3. Trigger -----------------------------------------------------------------
-- Tai dung public.set_updated_at() co san tu 0001, KHONG tao function moi.
drop trigger if exists set_document_solutions_updated_at on public.document_solutions;
create trigger set_document_solutions_updated_at
  before update on public.document_solutions
  for each row execute function public.set_updated_at();
