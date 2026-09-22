-- Migration: CN5 quet hinh anh de bai bang AI (FR-31 -> FR-37)
-- Chi mo rong whitelist anh cho bucket documents + cot documents.file_ext.
--
-- Idempotent: chay lai nhieu lan khong loi.
-- Cach chay: dan TOAN BO file vao Supabase Dashboard → SQL Editor → Run.
-- Khong chay tung doan roi rac.
-- Khong dung supabase link / db push (PAT sbp_ khong du quyen ghi, xem TASKS CN5-01).
-- Yeu cau chay truoc: 0002_cn2_documents.sql (bang documents + bucket documents).
-- Nguon su that DDL: file nay. docs/DATA-MODEL.md chi mo ta, lech thi sua theo file nay.
--
-- Bay 1 (duoi lech contentType): Supabase doan content-type theo duoi file;
-- khi allowed_mime_types da bat, upload voi path duoi .X nhung contentType Y
-- (X khong khop Y) bi bucket tu choi ngay luc upload. Code CN5-02/03 phai giu
-- cap ext <-> contentType khop nhau: ext chuan hoa truoc, contentType lay tu
-- bang map cua ext do, KHONG doan mime tu ten file goc cua picker.
--
-- Bay 2 (HEIC nhung ruot JPEG): iOS tra asset duoi .HEIC trong khi truong
-- base64 cua expo-image-picker LUON la du lieu JPEG. Code CN5-02/03 phai
-- chuan hoa ext theo du lieu THAT truoc khi upload: base64 JPEG -> luu .jpg
-- + image/jpeg, CAM giu .heic tu fileName goc. Chi giu .heic/.heif khi du
-- lieu that dung la HEIC/HEIF.
--
-- GIF: Gemini khong doc GIF nen migration nay KHONG mo gif (ca CHECK lan
-- bucket); client chan gif bang thong bao tieng Viet o FR-31, khong dua
-- gif len server.
--
-- Khong bang moi, khong cot moi, khong gia tri extraction_status moi,
-- khong policy/trigger/index moi. RLS + 4 Storage policy theo {user_id}/
-- tai dung nguyen ven tu 0002.

-- 1. Mo rong CHECK file_ext: pdf/docx/txt (cu) + png/jpg/jpeg/webp/heic/heif (moi).
-- Cap drop + add la idempotent theo cap: chay lai thi drop bo constraint vua
-- them roi add lai, khong bao loi. Hang cu deu nam trong danh sach moi nen
-- row hien co khong vi pham.
alter table public.documents drop constraint if exists documents_file_ext_whitelist;
alter table public.documents
  add constraint documents_file_ext_whitelist
  check (file_ext in ('pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg', 'webp', 'heic', 'heif'));

-- 2. Mo rong allowed_mime_types bucket documents: 3 MIME cu + 5 MIME anh.
-- jpg/jpeg chung image/jpeg; KHONG image/gif (Gemini khong doc).
-- Tran 10 MB + private giu nguyen, khop check file_size cua bang documents.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760,
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
