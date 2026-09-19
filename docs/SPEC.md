# Đặc tả AI Learning Assistant

## Bối cảnh

Ứng dụng di động độc lập cho sinh viên quản lý tài khoản cá nhân trong 5 ngày. Phạm vi duy nhất gồm xác thực, hồ sơ cá nhân và một bảng ghi chú học tập tối thiểu để chứng minh dữ liệu được cách ly bằng Row Level Security (RLS).

## Yêu cầu gốc và acceptance criteria

### CN1 — Quản lý tài khoản người dùng (FR-01 → FR-05, đã hoàn thành)

| FR    | Yêu cầu                                  | Acceptance criteria (Given / When / Then)                                                                                                                                                                                                                                                                             |
| ----- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-01 | Đăng ký bằng email và mật khẩu           | **Given** email hợp lệ chưa tồn tại, mật khẩu đạt chính sách và mã sinh viên hợp lệ, **When** gửi form đăng ký, **Then** Supabase tạo user, trigger tạo đúng một `profiles` row; dev vào app ngay, demo yêu cầu xác nhận email theo env. **Given** email/mã sinh viên đã tồn tại hoặc dữ liệu sai, **When** gửi form, **Then** không tạo thêm tài khoản và hiển thị lỗi an toàn. |
| FR-02 | Đăng nhập và đăng xuất                   | **Given** tài khoản hợp lệ, **When** đăng nhập, **Then** session được lưu bằng AsyncStorage và chuyển tới `/notes`. **Given** đang đăng nhập, **When** đăng xuất, **Then** session cục bộ bị xóa và route auth được hiển thị. Mật khẩu sai phải báo lỗi, không tạo session.                                           |
| FR-03 | Quên và đặt lại mật khẩu                 | **Given** email hợp lệ, **When** yêu cầu reset, **Then** `resetPasswordForEmail` gửi mã OTP 6 số và UI luôn hiển thị thông báo trung tính. **Given** email + OTP recovery còn hiệu lực, **When** `verifyOtp` xác minh thành công và nhập mật khẩu mới hợp lệ, **Then** cập nhật mật khẩu và chuyển về đăng nhập. OTP hết hạn/sai phải bị từ chối rõ ràng. |
| FR-04 | Cập nhật thông tin cá nhân               | **Given** đã đăng nhập, **When** sửa `full_name`, `student_code` hoặc avatar hợp lệ, **Then** chỉ row/profile và object avatar của chính user được cập nhật, UI hiển thị dữ liệu mới. Dữ liệu sai/offline không làm mất dữ liệu cũ.                                                                                   |
| FR-05 | Dữ liệu học tập riêng cho từng tài khoản | **Given** hai tài khoản A/B có ghi chú khác nhau, **When** A select/insert/update/delete qua Supabase client, **Then** A chỉ thao tác row có `user_id = auth.uid()`; truy cập row B bị RLS chặn. UI chỉ CRUD `study_notes(title, content)`.                                                                           |

## Quy tắc dữ liệu tối thiểu

### CN1

- `profiles`: một row cho mỗi `auth.users.id`; chứa `full_name`, `student_code`, `avatar_path`.
- `study_notes`: `id`, `user_id`, `title`, `content`, timestamp; không thêm môn học, tag hay chia sẻ.
- Avatar lưu trong bucket private `avatars`; database chỉ lưu path, không lưu public URL.
- Client có filter theo user khi hữu ích cho truy vấn, nhưng filter không thay thế RLS.

## OUT OF SCOPE

### CN1

- Vai trò admin/giáo viên, phân quyền theo role, quản trị tài khoản người khác.
- Social login, số điện thoại, MFA, đăng nhập sinh trắc học.
- Môn học, điểm, lịch học, bài tập, file học tập, nhắc việc, tìm kiếm, tag, chia sẻ note.
- Realtime, offline-first/sync queue, push notification, analytics.
- Web quản trị, backend riêng, Edge Functions, service-role key trong app.
- Development build, publish App Store/Google Play, native module tùy chỉnh, `ios/`/`android/` sinh sẵn.
- Test automation/E2E trong phạm vi 5 ngày; dùng type check, lint và checklist test tay.

### CN2 — Quản lý tài liệu học tập (FR-06 → FR-13)

| FR | Yêu cầu | Acceptance criteria (Given / When / Then) |
|----|---------|-------------------------------------------|
| FR-06 | Tải lên tài liệu học tập | **Given** đã đăng nhập và chọn tệp hợp lệ (đúng định dạng, ≤ 10 MB), **When** xác nhận tải lên, **Then** object nằm trong bucket `documents` tại `{user_id}/{uuid}.{ext}`, bản ghi `documents` được tạo, danh sách hiển thị tài liệu mới. **Given** tệp sai định dạng hoặc quá lớn, **When** chọn tệp, **Then** bị chặn ngay trước khi đọc tệp kèm thông báo rõ ràng, không tạo object hay bản ghi nào. |
| FR-07 | Hỗ trợ định dạng PDF, DOCX, TXT | **Given** tệp có phần mở rộng thuộc whitelist (`pdf`, `docx`, `txt`) và MIME tương ứng, **When** tải lên, **Then** được chấp nhận. **Given** tệp khác whitelist hoặc MIME không khớp phần mở rộng, **When** chọn tệp, **Then** bị từ chối kèm thông báo định dạng được hỗ trợ. |
| FR-08 | Hiển thị danh sách tài liệu đã tải lên | **Given** đã đăng nhập, **When** mở màn tài liệu, **Then** thấy đúng và chỉ tài liệu của mình, sắp theo ngày tải mới nhất trước. **Given** chưa có tài liệu nào, **When** mở màn, **Then** thấy empty state (icon + câu dẫn + nút tải lên), không phải màn trắng hay chữ “Không có dữ liệu”. |
| FR-09 | Xem thông tin tài liệu | **Given** đang ở chi tiết một tài liệu của mình, **When** xem, **Then** thấy tên hiển thị, ngày tải lên, kích thước (định dạng KB/MB), định dạng tệp, môn học (hoặc “Chưa phân loại”) và trạng thái trích xuất nội dung. |
| FR-10 | Đổi tên tài liệu | **Given** nhập tên mới hợp lệ (sau chuẩn hóa 1–120 ký tự), **When** lưu, **Then** chỉ nhãn hiển thị trong DB đổi, đường dẫn object trên storage giữ nguyên, UI hiển thị tên mới. **Given** tên rỗng/toàn khoảng trắng/quá dài, **When** lưu, **Then** bị chặn tại form, tên cũ giữ nguyên. |
| FR-11 | Xóa tài liệu | **Given** đang ở tài liệu của mình, **When** bấm xóa và xác nhận hộp thoại, **Then** cả bản ghi DB lẫn object trên storage đều bị xóa, danh sách cập nhật. **Given** chưa xác nhận, **When** hủy dialog, **Then** không có gì bị xóa. Xóa thẳng, không có thùng rác. |
| FR-12 | Tổ chức tài liệu theo môn học/chủ đề | **Given** đã đăng nhập, **When** tạo môn học tên hợp lệ, **Then** môn học thuộc về user, gán được cho tài liệu (mỗi tài liệu tối đa một môn). **Given** tài liệu chưa gán môn, **When** xem, **Then** hiển thị “Chưa phân loại”. **Given** xóa môn học đang có tài liệu, **When** xác nhận, **Then** môn học mất, các tài liệu rơi về “Chưa phân loại”, KHÔNG bị xóa theo. |
| FR-13 | Lưu trữ nội dung tài liệu cho chức năng AI | **Phạm vi CN2 chỉ là hạ tầng:** bảng `documents` có sẵn cột `extracted_text` (nullable) và `extraction_status` (`chưa xử lý`, `đang xử lý`, `thành công`, `thất bại`, `không hỗ trợ`). **Given** tải lên PDF/TXT, **When** upload xong, **Then** `extraction_status` = `chưa xử lý`, chờ CN3 trích xuất. **Given** tải lên DOCX, **When** upload xong, **Then** `extraction_status` = `không hỗ trợ`, UI gợi ý chuyển sang PDF. Phần gọi AI trích nội dung do CN3 thực hiện. |

### Luật validate CN2

- Tên tài liệu hiển thị (`display_name`): chuẩn hóa bằng cách trim đầu/cuối và gộp khoảng trắng thừa thành một; sau chuẩn hóa dài 1–120 ký tự; cho phép dấu tiếng Việt, chữ số, khoảng trắng và ký tự câu thông thường; tên rỗng hoặc toàn khoảng trắng bị từ chối.
- Tên môn học (`name`): chuẩn hóa tương tự; sau chuẩn hóa dài 1–60 ký tự; mỗi user không có hai môn trùng tên (so khớp sau chuẩn hóa, phân biệt hoa/thường).
- Phần mở rộng: lấy từ tên tệp gốc, lowercase, thuộc whitelist `pdf`, `docx`, `txt`; tệp không có phần mở rộng bị từ chối.
- MIME type: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`; phải tương ứng với phần mở rộng, lệch thì từ chối.
- Kích thước: tối đa 10 MB (10 × 1024 × 1024 byte); kiểm tra `size` do `expo-document-picker` trả về TRƯỚC khi đọc nội dung tệp; vượt thì báo lỗi, không đọc tệp.
- Thứ tự kiểm tra khi chọn tệp: tồn tại tệp → phần mở rộng → MIME → kích thước; dừng ở lỗi đầu tiên với một thông báo rõ ràng.

### Quy tắc dữ liệu CN2

- `subjects`: một row thuộc về một user (`user_id`); chứa `name`; xóa môn học đang có tài liệu thì tài liệu về “Chưa phân loại” (`ON DELETE SET NULL`), không xóa theo.
- `documents`: chứa `user_id`, `subject_id` (nullable), `display_name`, `storage_path` (`{user_id}/{uuid}.{ext}`), `file_ext`, `mime_type`, `file_size`, `extracted_text` (nullable), `extraction_status`, timestamp.
- Tên file trên storage là UUID, không dùng tên gốc (tên gốc có dấu/khoảng trắng/ký tự lạ và có thể trùng). DB lưu tên gốc làm nhãn hiển thị.
- Đổi tên (FR-10) chỉ đổi nhãn trong DB, tuyệt đối không đổi tên object trên storage.
- Xóa (FR-11) phải xóa cả bản ghi DB lẫn object storage; thứ tự và xử lý lỗi giữa chừng xem `docs/ARCHITECTURE.md`.
- Bucket `documents` PRIVATE; DB chỉ lưu đường dẫn, không lưu URL; xem/tải bằng signed URL TTL 3600s.

### OUT OF SCOPE của CN2 (đề không yêu cầu)

Thùng rác/khôi phục, đánh dấu yêu thích, thống kê, dọn file mồ côi, chia sẻ tài liệu, đổi file gốc sau khi tải lên, tìm kiếm text nâng cao (chỉ liệt kê + lọc theo môn học), quan hệ nhiều-nhiều giữa tài liệu và môn học.

## CẦN CHỦ DỰ ÁN QUYẾT ĐỊNH

Không còn câu hỏi mở. Chủ dự án đã chốt:

1. Chạy bằng **Expo Go**, không dùng development build.
2. FR-03 dùng OTP 6 số qua email: `resetPasswordForEmail` + `verifyOtp` với type `recovery`; không phụ thuộc deep link. Deep link chỉ là bonus nếu còn thời gian.
3. Tắt **Confirm email** khi dev; biến `EXPO_PUBLIC_REQUIRE_EMAIL_CONFIRMATION=false`. Khi demo, bật lại trên Supabase Dashboard và đổi cờ thành `true`.
4. `student_code` bắt buộc, duy nhất và phân biệt hoa/thường.
5. Avatar chỉ nhận JPEG/PNG/WEBP, tối đa 2 MB.
6. Mật khẩu tối thiểu 8 ký tự, có ít nhất một chữ và một số.
