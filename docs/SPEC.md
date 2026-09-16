# Đặc tả Student Account Manager

## Bối cảnh

Ứng dụng di động độc lập cho sinh viên quản lý tài khoản cá nhân trong 5 ngày. Phạm vi duy nhất gồm xác thực, hồ sơ cá nhân và một bảng ghi chú học tập tối thiểu để chứng minh dữ liệu được cách ly bằng Row Level Security (RLS).

## Yêu cầu gốc và acceptance criteria

| FR    | Yêu cầu                                  | Acceptance criteria (Given / When / Then)                                                                                                                                                                                                                                                                             |
| ----- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-01 | Đăng ký bằng email và mật khẩu           | **Given** email hợp lệ chưa tồn tại, mật khẩu đạt chính sách và mã sinh viên hợp lệ, **When** gửi form đăng ký, **Then** Supabase tạo user, trigger tạo đúng một `profiles` row và UI yêu cầu xác nhận email. **Given** email/mã sinh viên đã tồn tại hoặc dữ liệu sai, **When** gửi form, **Then** không tạo thêm tài khoản và hiển thị lỗi an toàn. |
| FR-02 | Đăng nhập và đăng xuất                   | **Given** tài khoản hợp lệ, **When** đăng nhập, **Then** session được lưu bằng AsyncStorage và chuyển tới `/notes`. **Given** đang đăng nhập, **When** đăng xuất, **Then** session cục bộ bị xóa và route auth được hiển thị. Mật khẩu sai phải báo lỗi, không tạo session.                                           |
| FR-03 | Quên và đặt lại mật khẩu                 | **Given** email hợp lệ, **When** yêu cầu reset, **Then** UI luôn hiển thị thông báo trung tính. **Given** deep link reset còn hiệu lực, **When** nhập mật khẩu mới hợp lệ, **Then** cập nhật mật khẩu và chuyển về đăng nhập. Link hết hạn phải bị từ chối rõ ràng.                                                   |
| FR-04 | Cập nhật thông tin cá nhân               | **Given** đã đăng nhập, **When** sửa `full_name`, `student_code` hoặc avatar hợp lệ, **Then** chỉ row/profile và object avatar của chính user được cập nhật, UI hiển thị dữ liệu mới. Dữ liệu sai/offline không làm mất dữ liệu cũ.                                                                                   |
| FR-05 | Dữ liệu học tập riêng cho từng tài khoản | **Given** hai tài khoản A/B có ghi chú khác nhau, **When** A select/insert/update/delete qua Supabase client, **Then** A chỉ thao tác row có `user_id = auth.uid()`; truy cập row B bị RLS chặn. UI chỉ CRUD `study_notes(title, content)`.                                                                           |

## Quy tắc dữ liệu tối thiểu

- `profiles`: một row cho mỗi `auth.users.id`; chứa `full_name`, `student_code`, `avatar_path`.
- `study_notes`: `id`, `user_id`, `title`, `content`, timestamp; không thêm môn học, tag hay chia sẻ.
- Avatar lưu trong bucket private `avatars`; database chỉ lưu path, không lưu public URL.
- Client có filter theo user khi hữu ích cho truy vấn, nhưng filter không thay thế RLS.

## OUT OF SCOPE

- Vai trò admin/giáo viên, phân quyền theo role, quản trị tài khoản người khác.
- Social login, số điện thoại, MFA, đăng nhập sinh trắc học.
- Môn học, điểm, lịch học, bài tập, file học tập, nhắc việc, tìm kiếm, tag, chia sẻ note.
- Realtime, offline-first/sync queue, push notification, analytics.
- Web quản trị, backend riêng, Edge Functions, service-role key trong app.
- Publish App Store/Google Play, native module tùy chỉnh, `ios/`/`android/` sinh sẵn.
- Test automation/E2E trong phạm vi 5 ngày; dùng type check, lint và checklist test tay.

## CẦN CHỦ DỰ ÁN QUYẾT ĐỊNH

Không còn câu hỏi mở. Chủ dự án đã chốt:

1. Bật **Confirm email** trên Supabase Auth.
2. Deep-link scheme là `studentaccountmanager`; reset URL là `studentaccountmanager://reset-password`.
3. `student_code` bắt buộc, duy nhất và phân biệt hoa/thường.
4. Avatar chỉ nhận JPEG/PNG/WEBP, tối đa 2 MB.
5. Mật khẩu tối thiểu 8 ký tự, có ít nhất một chữ và một số.
