-- FR-38..FR-45: phan biet loai phan hoi va giu so buoc goi y gan nhat.
begin;
alter table public.document_solutions
  add column if not exists response_type text not null default 'hint'
    check (response_type in ('analysis', 'hint', 'explanation', 'solution', 'follow_up')),
  add column if not exists hint_step integer not null default 0
    check (hint_step >= 0);
notify pgrst, 'reload schema';
commit;
