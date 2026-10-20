-- Kiem chung CN3 sau khi ap tat ca migration den 0011. FILE CHI DOC, khong sua gi.
-- Cach chay: SQL Editor chi hien ket qua cau CUOI, nen copy TOAN BO file
-- (da gop bang union all thanh mot cau duy nhat) roi Run mot lan.
-- Mong doi: moi dong deu DAT. Dong nao KHONG DAT thi ap migration chua dung.

select 'bang document_summaries ton tai' as muc_kiem_tra,
  case when exists (
    select 1 from pg_class
    join pg_namespace on pg_namespace.oid = pg_class.relnamespace
    where pg_namespace.nspname = 'public' and pg_class.relname = 'document_summaries'
  ) then 'DAT' else 'KHONG DAT' end as ket_qua,
  'pg_class public.document_summaries' as chi_tiet
union all
select 'RLS da bat tren document_summaries',
  case when (select relrowsecurity from pg_class
             join pg_namespace on pg_namespace.oid = pg_class.relnamespace
            where pg_namespace.nspname = 'public' and pg_class.relname = 'document_summaries')
    then 'DAT' else 'KHONG DAT' end,
  'pg_class.relrowsecurity cua public.document_summaries'
union all
select 'document_summaries du 4 CRUD + 1 restrictive (hien co ' ||
  (select count(*)::text from pg_policies
    where schemaname = 'public' and tablename = 'document_summaries') || ')',
  case when (select count(*) from pg_policies
              where schemaname = 'public' and tablename = 'document_summaries') = 5
    then 'DAT' else 'KHONG DAT' end,
  (select string_agg(policyname, ', ') from pg_policies
    where schemaname = 'public' and tablename = 'document_summaries')
union all
select 'lich su nhieu ban + metadata ton tai',
  case when not exists (select 1 from pg_constraint where conname = 'document_summaries_document_unique')
    and exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'document_summaries_doc_created_idx')
    and (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'document_summaries'
      and column_name in ('summary_level', 'summary_scope', 'section_title')) = 3
    then 'DAT' else 'KHONG DAT' end,
  'Migration 0008 giu lich su, 0011 them policy parent ownership'
union all
select 'FK document_id la CASCADE ve documents',
  case when (select pg_get_constraintdef(oid) from pg_constraint
             where conname = 'document_summaries_document_id_fkey')
    like '%CASCADE%' then 'DAT' else 'KHONG DAT' end,
  (select pg_get_constraintdef(oid) from pg_constraint
    where conname = 'document_summaries_document_id_fkey')
union all
select 'FK user_id la CASCADE ve auth.users',
  case when (select pg_get_constraintdef(oid) from pg_constraint
             where conname = 'document_summaries_user_id_fkey') like '%CASCADE%'
    then 'DAT' else 'KHONG DAT' end,
  (select pg_get_constraintdef(oid) from pg_constraint
    where conname = 'document_summaries_user_id_fkey')
union all
select 'check summary_text 1-20000 ton tai',
  case when exists (
    select 1 from pg_constraint
    where conname = 'document_summaries_summary_rules'
  ) then 'DAT' else 'KHONG DAT' end,
  (select pg_get_constraintdef(oid) from pg_constraint
    where conname = 'document_summaries_summary_rules')
union all
select 'check model ton tai',
  case when exists (
    select 1 from pg_constraint
    where conname = 'document_summaries_model_rules'
  ) then 'DAT' else 'KHONG DAT' end,
  (select pg_get_constraintdef(oid) from pg_constraint
    where conname = 'document_summaries_model_rules')
union all
select 'index document_summaries_user_idx ton tai',
  case when exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'document_summaries_user_idx'
  ) then 'DAT' else 'KHONG DAT' end,
  (select indexdef from pg_indexes
    where schemaname = 'public' and indexname = 'document_summaries_user_idx')
union all
select 'trigger updated_at ton tai',
  case when exists (
    select 1 from pg_trigger
    where tgname = 'set_document_summaries_updated_at'
  ) then 'DAT' else 'KHONG DAT' end,
  'pg_trigger.set_document_summaries_updated_at (tai dung set_updated_at)';
