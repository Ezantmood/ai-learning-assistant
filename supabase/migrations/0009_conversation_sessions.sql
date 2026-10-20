-- FR-27..FR-30: nhom cac luot da duoc nguoi dung chon luu.
-- Row cu NULL duoc UI xem la mot hoi thoai rieng, khong sua/xoa lich su cu.
begin;
alter table public.document_questions add column if not exists conversation_id uuid;
create index if not exists document_questions_conversation_idx
  on public.document_questions (user_id, document_id, conversation_id, created_at);
notify pgrst, 'reload schema';
commit;
