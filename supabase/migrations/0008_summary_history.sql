-- FR-18..FR-22: moi ket qua la mot ban da luu; giu toan bo du lieu cu.
begin;
alter table public.document_summaries
  add column if not exists summary_level text not null default 'medium'
    check (summary_level in ('short', 'medium', 'detailed')),
  add column if not exists summary_scope text not null default 'whole'
    check (summary_scope in ('whole', 'sections')),
  add column if not exists section_title text not null default ''
    check (char_length(section_title) <= 200);
alter table public.document_summaries
  drop constraint if exists document_summaries_document_unique;
create index if not exists document_summaries_doc_created_idx
  on public.document_summaries (document_id, created_at desc, id desc);
notify pgrst, 'reload schema';
commit;
