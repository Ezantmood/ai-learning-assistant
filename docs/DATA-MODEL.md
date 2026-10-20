# Dữ liệu và RLS — hiện hành 2026-10-20

DDL thật ở supabase/migrations; types tại src/shared/types/database.ts.
Đối chiếu 57 cột Row/nullability/kiểu cơ bản với catalog remote đạt.
Types CN2+ đồng bộ tay; CLI Supabase chưa có trên máy, không ghi đã regen.

## Bảng và vòng đời

| Bảng | Cột nghiệp vụ | Quan hệ/giới hạn |
|---|---|---|
| profiles | id, full_name, student_code, avatar_path | id = auth.users.id; mã sinh viên duy nhất; user xóa → CASCADE |
| study_notes | id, user_id, title, content | ghi chú riêng, có created_at/updated_at |
| subjects | id, user_id, name | tên theo tài khoản, tối đa 60 ký tự |
| documents | id, user_id, subject_id, display_name, storage_path, file_ext, mime_type, file_size, extracted_text, extraction_status | path UNIQUE; tên 1–120; tệp 1–10 MB; subject SET NULL khi xóa |
| document_summaries | id, document_id, user_id, summary_text, model, summary_level, summary_scope, section_title | nhiều bản/tài liệu từ 0008; text 1–20.000; level short/medium/detailed; scope whole/sections; title ≤200 |
| document_questions | id, document_id, user_id, conversation_id, question, answer, model | chỉ lưu theo lựa chọn; question 1–500, answer 1–20.000; conversation_id nullable cho row cũ |
| document_solutions | id, document_id, user_id, solution_text, model, response_type, hint_step | UNIQUE(document_id); kết quả gần nhất; text 1–20.000; response_type 5 loại, hint_step ≥0 |

Các bảng đều có created_at/updated_at. set_updated_at tái dùng từ 0001;
handle_new_user tạo profile khi đăng ký. user_id FK auth.users CASCADE.
Ba bảng kết quả FK documents CASCADE: xóa tài liệu dọn các kết quả/lịch sử.
App xóa object Storage trước rồi mới xóa row, tránh bản ghi trỏ object mất.
Xóa chủ đề không xóa tài liệu, chỉ documents.subject_id trở thành NULL.

## RLS

Mọi bảng public bật RLS; 4 policy CRUD sở hữu dùng auth.uid(). authenticated
chỉ được thao tác row của mình, anon không được dữ liệu riêng. Publishable
key chỉ xác định project, không thay thế JWT/policy. Service-role chỉ local
proof/vận hành và không xuất hiện trong bundle app.

Migration 0011 bổ sung policy restrictive (AND với policy CRUD cũ):

- documents: user_id đúng; Storage path bắt đầu bằng uid/; subject_id nếu có
  phải là môn của cùng tài khoản. Kiểm khi INSERT/UPDATE.
- document_summaries/questions/solutions: document_id phải thuộc tài khoản
  hiện tại cả khi đọc/ghi/xóa. Chỉ kiểm user_id không đủ: trước sửa có thể
  tạo row user A gắn document B hoặc đổi document_id sang B.

Có 4 policy CRUD + 1 restrictive tại documents và 3 bảng kết quả, subjects
vẫn 4. Không tắt RLS/không tạo quyền công khai để khắc phục lỗi.

## Storage

- avatars private, 2 MB, JPEG/PNG/WEBP, path uid/...; signed URL TTL 3600 giây.
- documents private, 10 MB, PDF/DOCX/TXT và PNG/JPEG/WEBP/HEIC/HEIF (8 MIME).
  .jpg/.jpeg cùng image/jpeg; ảnh từ base64 picker chuẩn hóa .jpg.
- 4 policy mỗi bucket ràng buộc thư mục đầu uid; user khác không download,
  signed URL, ghi/xóa. Không chỉ filter user_id phía client.

## Trạng thái trích xuất

pending → processing → done/failed; DOCX → unsupported, không gọi AI.
PDF/TXT lưu extracted_text cho hỏi đáp/giải bài. Ảnh OCR lưu text và có thể
sửa; sửa chỉ cập nhật extracted_text, không thay ảnh gốc. Processing treo
15 phút được client thu hồi khi mở màn. JSON bị cắt có thể cứu một phần
và cảnh báo; cần dùng tài liệu ngắn hơn để trích đầy đủ.

## Thứ tự migration

0001 → 0002 → 0004 → 0005 → 0006 → 0007 → 0008 → 0009 → 0010 → 0011.
Không có 0003. Không chạy lại migration cũ sau migration mới (0004 tái tạo
UNIQUE document_id sẽ xung đột với lịch sử nhiều bản). Không sửa file đã áp.

0008 giữ lịch sử tóm tắt và metadata; 0009 thêm conversation_id;
0010 thêm loại phản hồi/bước; 0011 khóa quyền tài liệu cha/môn/path.
Cả 4 migration đợt audit đã áp thành công qua kết nối Postgres hiện có.

## Bằng chứng

scripts/fr-audit-proof.mjs: 43/51 trước sửa, 51/51 sau 0011; tài khoản/object
test được dọn. Bao gồm CRUD A/B, giả user và giả document_id, Storage,
SET NULL/CASCADE, nhiều phiên bản. scripts/cn2-schema-verify.sql 14/14 và
cn3-schema-verify.sql 10/10 đã cập nhật schema hiện hành, không còn kiểm
UNIQUE của summary hay whitelist 3 MIME cũ. Chi tiết RLS-PROOF.md.
