-- FR-05: user_id dung chua du; ban ghi con phai tham chieu tai lieu/mon cua chinh chu.
-- Policy restrictive duoc AND voi 4 policy CRUD da co, khong mo rong quyen.
begin;
drop policy if exists documents_valid_references on public.documents;
create policy documents_valid_references on public.documents
  as restrictive for all to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and split_part(storage_path, '/', 1) = auth.uid()::text
    and (subject_id is null or exists (
      select 1 from public.subjects s where s.id = documents.subject_id and s.user_id = auth.uid()
    ))
  );

drop policy if exists document_summaries_parent_own on public.document_summaries;
create policy document_summaries_parent_own on public.document_summaries
  as restrictive for all to authenticated
  using (exists (select 1 from public.documents d where d.id = document_summaries.document_id and d.user_id = auth.uid()))
  with check (exists (select 1 from public.documents d where d.id = document_summaries.document_id and d.user_id = auth.uid()));

drop policy if exists document_questions_parent_own on public.document_questions;
create policy document_questions_parent_own on public.document_questions
  as restrictive for all to authenticated
  using (exists (select 1 from public.documents d where d.id = document_questions.document_id and d.user_id = auth.uid()))
  with check (exists (select 1 from public.documents d where d.id = document_questions.document_id and d.user_id = auth.uid()));

drop policy if exists document_solutions_parent_own on public.document_solutions;
create policy document_solutions_parent_own on public.document_solutions
  as restrictive for all to authenticated
  using (exists (select 1 from public.documents d where d.id = document_solutions.document_id and d.user_id = auth.uid()))
  with check (exists (select 1 from public.documents d where d.id = document_solutions.document_id and d.user_id = auth.uid()));
notify pgrst, 'reload schema';
commit;
