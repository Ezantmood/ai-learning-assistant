-- Migration: Student Account Manager (G2)
-- Tables: public.profiles, public.study_notes
-- RLS + triggers + Storage bucket avatars
--
-- Idempotent: chạy lại nhiều lần không lỗi.
-- Cách chạy: dán toàn bộ file vào Supabase Dashboard → SQL Editor → Run.
-- Không chạy từng đoạn rời rạc (thiếu policy sẽ hở bảo mật).

-- 1. Extension cho gen_random_uuid() -------------------------------------
create extension if not exists "pgcrypto";

-- 2. Bảng profiles --------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  student_code text not null,
  avatar_path text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Constraints profiles (thêm nếu chưa có để chạy lại an toàn).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_full_name_max_100'
  ) then
    alter table public.profiles
      add constraint profiles_full_name_max_100
      check (char_length(full_name) <= 100);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_student_code_rules'
  ) then
    alter table public.profiles
      add constraint profiles_student_code_rules
      check (
        char_length(trim(student_code)) > 0
        and char_length(student_code) <= 30
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_student_code_unique'
  ) then
    alter table public.profiles
      add constraint profiles_student_code_unique unique (student_code);
  end if;
end
$$;

-- 3. Bảng study_notes ------------------------------------------------------
create table if not exists public.study_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'study_notes_title_rules'
  ) then
    alter table public.study_notes
      add constraint study_notes_title_rules
      check (
        char_length(trim(title)) > 0
        and char_length(title) <= 120
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'study_notes_content_max_5000'
  ) then
    alter table public.study_notes
      add constraint study_notes_content_max_5000
      check (char_length(content) <= 5000);
  end if;
end
$$;

create index if not exists study_notes_user_updated_idx
  on public.study_notes (user_id, updated_at desc);

-- 4. RLS -------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.study_notes enable row level security;

-- 4a. Policies cho profiles (không có DELETE: client không được xóa profile).
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 4b. Policies cho study_notes (đủ 4 lệnh).
drop policy if exists study_notes_select_own on public.study_notes;
create policy study_notes_select_own
  on public.study_notes for select
  using (auth.uid() = user_id);

drop policy if exists study_notes_insert_own on public.study_notes;
create policy study_notes_insert_own
  on public.study_notes for insert
  with check (auth.uid() = user_id);

drop policy if exists study_notes_update_own on public.study_notes;
create policy study_notes_update_own
  on public.study_notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists study_notes_delete_own on public.study_notes;
create policy study_notes_delete_own
  on public.study_notes for delete
  using (auth.uid() = user_id);

-- 4c. Table grants (RLS policy chưa đủ: role còn cần quyền bảng).
-- authenticated: CRUD để RLS thu hẹp theo từng user.
-- service_role: full cho vận hành/admin (vẫn cần grant dù bypass RLS).
-- anon: không cấp (bắt buộc đăng nhập).
grant select, insert, update, delete
  on public.profiles to authenticated;
grant select, insert, update, delete
  on public.study_notes to authenticated;
grant all
  on public.profiles to service_role;
grant all
  on public.study_notes to service_role;
revoke all
  on public.profiles from anon;
revoke all
  on public.study_notes from anon;

-- 5. Trigger ----------------------------------------------------------------
-- 5a. Tự tạo profile khi có auth.users mới.
-- student_code thiếu/rỗng/dài quá → raise exception → sign-up thất bại.
-- student_code trùng đúng hoa/thường → unique violation → sign-up thất bại.
-- on conflict (id) do nothing chỉ chống tạo 2 profile cho cùng một user id.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = '' as
$func$
declare
  v_full_name text := coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), '');
  v_student_code text := nullif(trim(new.raw_user_meta_data ->> 'student_code'), '');
begin
  if v_student_code is null then
    raise exception 'student_code is required';
  end if;

  if char_length(v_student_code) > 30 then
    raise exception 'student_code must be at most 30 characters';
  end if;

  if char_length(v_full_name) > 100 then
    raise exception 'full_name must be at most 100 characters';
  end if;

  insert into public.profiles (id, full_name, student_code)
  values (new.id, v_full_name, v_student_code)
  on conflict (id) do nothing;

  return new;
end;
$func$;

revoke all on function public.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5b. Tự cập nhật updated_at trước mỗi UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = '' as
$func$
begin
  new.updated_at = now();
  return new;
end;
$func$;

revoke all on function public.set_updated_at() from public;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_study_notes_updated_at on public.study_notes;
create trigger set_study_notes_updated_at
  before update on public.study_notes
  for each row execute function public.set_updated_at();

-- 6. Storage bucket avatars (private) ----------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Policies trên storage.objects: chỉ thư mục của chính user.
-- Path quy ước: <auth.uid()>/avatar.<ext>, ví dụ <uid>/avatar.jpg.
drop policy if exists avatars_select_own on storage.objects;
create policy avatars_select_own
  on storage.objects for select
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
