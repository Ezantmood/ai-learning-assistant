-- Kiem chung CN2 sau khi ap 0002_cn2_documents.sql. FILE CHI DOC, khong sua gi.
-- Cach chay: SQL Editor chi hien ket qua cau CUOI, nen copy TOAN BO file
-- (da gop bang union all thanh mot cau duy nhat) roi Run mot lan.
-- Mong doi: moi dong deu DAT. Dong nao KHONG DAT thi ap migration chua dung.

select 'bucket documents ton tai, private, 10485760 byte' as muc_kiem_tra,
  case when exists (
    select 1 from storage.buckets
    where id = 'documents' and public = false and file_size_limit = 10485760
  ) then 'DAT' else 'KHONG DAT' end as ket_qua,
  (select 'public=' || public::text || ', limit=' || file_size_limit::text
   from storage.buckets where id = 'documents') as chi_tiet
union all
select 'bucket documents dung 3 MIME whitelist',
  case when exists (
    select 1 from storage.buckets
    where id = 'documents'
      and allowed_mime_types @> array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      and array_length(allowed_mime_types, 1) = 3
  ) then 'DAT' else 'KHONG DAT' end,
  (select array_to_string(allowed_mime_types, ', ')
   from storage.buckets where id = 'documents')
union all
select 'RLS da bat tren subjects',
  case when (select relrowsecurity from pg_class
             join pg_namespace on pg_namespace.oid = pg_class.relnamespace
            where pg_namespace.nspname = 'public' and pg_class.relname = 'subjects')
    then 'DAT' else 'KHONG DAT' end,
  'pg_class.relrowsecurity cua public.subjects'
union all
select 'RLS da bat tren documents',
  case when (select relrowsecurity from pg_class
             join pg_namespace on pg_namespace.oid = pg_class.relnamespace
            where pg_namespace.nspname = 'public' and pg_class.relname = 'documents')
    then 'DAT' else 'KHONG DAT' end,
  'pg_class.relrowsecurity cua public.documents'
union all
select 'subjects du 4 policy (hien co ' ||
  (select count(*)::text from pg_policies
    where schemaname = 'public' and tablename = 'subjects') || ')',
  case when (select count(*) from pg_policies
              where schemaname = 'public' and tablename = 'subjects') = 4
    then 'DAT' else 'KHONG DAT' end,
  (select string_agg(policyname, ', ') from pg_policies
    where schemaname = 'public' and tablename = 'subjects')
union all
select 'documents du 4 policy (hien co ' ||
  (select count(*)::text from pg_policies
    where schemaname = 'public' and tablename = 'documents') || ')',
  case when (select count(*) from pg_policies
              where schemaname = 'public' and tablename = 'documents') = 4
    then 'DAT' else 'KHONG DAT' end,
  (select string_agg(policyname, ', ') from pg_policies
    where schemaname = 'public' and tablename = 'documents')
union all
select 'storage.objects du 4 policy cho bucket documents (hien co ' ||
  (select count(*)::text from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname like 'documents\_%\_own') || ')',
  case when (select count(*) from pg_policies
              where schemaname = 'storage' and tablename = 'objects'
                and policyname like 'documents\_%\_own') = 4
    then 'DAT' else 'KHONG DAT' end,
  (select string_agg(policyname, ', ') from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname like 'documents\_%\_own')
union all
select 'FK documents.subject_id la SET NULL',
  case when (select r.confdeltype from pg_constraint r
              join pg_class t on t.oid = r.conrelid
              join pg_namespace n on n.oid = t.relnamespace
             where n.nspname = 'public' and t.relname = 'documents'
               and r.conname = 'documents_subject_id_fkey') = 'n'
    then 'DAT' else 'KHONG DAT' end,
  'confdeltype = n (set null), chi tiet xem dinh nghia FK'
union all
select 'FK documents.user_id la CASCADE',
  case when (select pg_get_constraintdef(oid) from pg_constraint
             where conname = 'documents_user_id_fkey') like '%CASCADE%'
    then 'DAT' else 'KHONG DAT' end,
  (select pg_get_constraintdef(oid) from pg_constraint
    where conname = 'documents_user_id_fkey')
union all
select 'index documents_user_created_idx ton tai',
  case when exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'documents_user_created_idx'
  ) then 'DAT' else 'KHONG DAT' end,
  (select indexdef from pg_indexes
    where schemaname = 'public' and indexname = 'documents_user_created_idx')
union all
select 'index documents_subject_idx ton tai',
  case when exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'documents_subject_idx'
  ) then 'DAT' else 'KHONG DAT' end,
  (select indexdef from pg_indexes
    where schemaname = 'public' and indexname = 'documents_subject_idx')
union all
select 'check file_ext whitelist ton tai',
  case when exists (
    select 1 from pg_constraint
    where conname = 'documents_file_ext_whitelist'
  ) then 'DAT' else 'KHONG DAT' end,
  (select pg_get_constraintdef(oid) from pg_constraint
    where conname = 'documents_file_ext_whitelist')
union all
select 'check file_size 10MB ton tai',
  case when exists (
    select 1 from pg_constraint
    where conname = 'documents_file_size_rules'
  ) then 'DAT' else 'KHONG DAT' end,
  (select pg_get_constraintdef(oid) from pg_constraint
    where conname = 'documents_file_size_rules')
union all
select 'check extraction_status ton tai',
  case when exists (
    select 1 from pg_constraint
    where conname = 'documents_extraction_status_rules'
  ) then 'DAT' else 'KHONG DAT' end,
  (select pg_get_constraintdef(oid) from pg_constraint
    where conname = 'documents_extraction_status_rules');
