-- Migration: CN2 Quan ly tai lieu hoc tap (FR-06 -> FR-13)
-- Tables: public.subjects, public.documents
-- RLS + trigger + Storage bucket documents
--
-- Idempotent: chay lai nhieu lan khong loi.
-- Cach chay: dan TOAN BO file vao Supabase Dashboard → SQL Editor → Run.
-- Khong chay tung doan roi rac (thieu policy se ho bao mat).
-- Khong dung supabase link / db push (access token sbp_ khong du quyen).
-- Nguon su that DDL: file nay. docs/DATA-MODEL.md chi mo ta, lech thi sua theo file nay.

-- 1. Extension cho gen_random_uuid() -------------------------------------
create extension if not exists "pgcrypto";

-- 2. Bang subjects (PHAI TRUOC documents: documents.subject_id tro toi day) --
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Constraints subjects (them neu chua co de chay lai an toan,
-- ke ca khi bang da duoc tao tay truoc do ma thieu rang buoc).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'subjects_name_rules'
  ) then
    alter table public.subjects
      add constraint subjects_name_rules
      check (char_length(name) between 1 and 60);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'subjects_user_name_unique'
  ) then
    alter table public.subjects
      add constraint subjects_user_name_unique unique (user_id, name);
  end if;
end
$$;

create index if not exists subjects_user_idx
  on public.subjects (user_id);

-- 3. Bang documents ---------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid null,
  display_name text not null,
  storage_path text not null,
  file_ext text not null,
  mime_type text not null,
  file_size bigint not null,
  extracted_text text null,
  extraction_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Constraints + FK documents (them neu chua co).
-- subject_id SET NULL: xoa mon hoc thi tai lieu ve "Chua phan loai", khong mat theo.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'documents_subject_id_fkey'
  ) then
    alter table public.documents
      add constraint documents_subject_id_fkey
      foreign key (subject_id)
      references public.subjects (id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'documents_display_name_rules'
  ) then
    alter table public.documents
      add constraint documents_display_name_rules
      check (char_length(display_name) between 1 and 120);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'documents_storage_path_unique'
  ) then
    alter table public.documents
      add constraint documents_storage_path_unique unique (storage_path);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'documents_file_ext_whitelist'
  ) then
    alter table public.documents
      add constraint documents_file_ext_whitelist
      check (file_ext in ('pdf', 'docx', 'txt'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'documents_file_size_rules'
  ) then
    alter table public.documents
      add constraint documents_file_size_rules
      check (file_size > 0 and file_size <= 10485760);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'documents_extraction_status_rules'
  ) then
    alter table public.documents
      add constraint documents_extraction_status_rules
      check (extraction_status in ('pending', 'processing', 'done', 'failed', 'unsupported'));
  end if;
end
$$;

-- FR-08: liet ke theo user, moi nhat truoc. FR-12: loc theo mon hoc.
create index if not exists documents_user_created_idx
  on public.documents (user_id, created_at desc);
create index if not exists documents_subject_idx
  on public.documents (subject_id);

-- 4. RLS -------------------------------------------------------------------
alter table public.subjects enable row level security;
alter table public.documents enable row level security;

-- 4a. Policies cho subjects (du 4 lenh).
drop policy if exists subjects_select_own on public.subjects;
create policy subjects_select_own
  on public.subjects for select
  using (auth.uid() = user_id);

drop policy if exists subjects_insert_own on public.subjects;
create policy subjects_insert_own
  on public.subjects for insert
  with check (auth.uid() = user_id);

drop policy if exists subjects_update_own on public.subjects;
create policy subjects_update_own
  on public.subjects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists subjects_delete_own on public.subjects;
create policy subjects_delete_own
  on public.subjects for delete
  using (auth.uid() = user_id);

-- 4b. Policies cho documents (du 4 lenh).
drop policy if exists documents_select_own on public.documents;
create policy documents_select_own
  on public.documents for select
  using (auth.uid() = user_id);

drop policy if exists documents_insert_own on public.documents;
create policy documents_insert_own
  on public.documents for insert
  with check (auth.uid() = user_id);

drop policy if exists documents_update_own on public.documents;
create policy documents_update_own
  on public.documents for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists documents_delete_own on public.documents;
create policy documents_delete_own
  on public.documents for delete
  using (auth.uid() = user_id);

-- 4c. Table grants (RLS policy chua du: role con can quyen bang).
-- authenticated: CRUD de RLS thu hep theo tung user.
-- service_role: full cho van hanh/admin (van can grant du bypass RLS).
-- anon: khong cap (bat buoc dang nhap).
grant select, insert, update, delete
  on public.subjects to authenticated;
grant select, insert, update, delete
  on public.documents to authenticated;
grant all
  on public.subjects to service_role;
grant all
  on public.documents to service_role;
revoke all
  on public.subjects from anon;
revoke all
  on public.documents from anon;

-- 5. Trigger ----------------------------------------------------------------
-- Tai dung public.set_updated_at() co san tu 0001, KHONG tao function moi.
drop trigger if exists set_subjects_updated_at on public.subjects;
create trigger set_subjects_updated_at
  before update on public.subjects
  for each row execute function public.set_updated_at();

drop trigger if exists set_documents_updated_at on public.documents;
create trigger set_documents_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

-- 6. Storage bucket documents (private) ---------------------------------------
-- Bucket co the DA duoc tao tay tren Dashboard truoc do: chua co thi tao,
-- da co thi cap nhat dung cau hinh (private, 10485760 byte, dung 3 MIME).
-- Gioi han 10485760 byte KHOP TUYET DOI voi check file_size cua bang documents.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760,
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Policies tren storage.objects: chi thu muc cua chinh user.
-- Path quy uoc: <auth.uid()>/<uuid>.<ext>, vi du <uid>/a1b2c3d4.pdf.
drop policy if exists documents_select_own on storage.objects;
create policy documents_select_own
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists documents_insert_own on storage.objects;
create policy documents_insert_own
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists documents_update_own on storage.objects;
create policy documents_update_own
  on storage.objects for update
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists documents_delete_own on storage.objects;
create policy documents_delete_own
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
