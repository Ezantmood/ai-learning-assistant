# Checklist kiểm thử tay

## Cách ghi kết quả

Mỗi case đổi `[ ]` thành `[x]` khi đạt và thêm `YYYY-MM-DD | nền tảng | tài khoản A/B | kết quả ngắn`. Không ghi email thật, mật khẩu hoặc token. Trước mỗi giai đoạn: `npx tsc --noEmit` và `npm run lint`.

## FR-01 — Đăng ký

- [ ] Đăng ký email, mã sinh viên mới + mật khẩu hợp lệ → user và profile được tạo; dev vào app ngay, demo yêu cầu xác nhận email.
- [ ] Email sai định dạng → lỗi tại field; không gọi API.
- [ ] Mật khẩu không đạt chính sách / confirm khác → lỗi; không tạo user.
- [ ] **Email trùng** → không tạo user/profile thứ hai; UI không làm lộ thông tin quá mức.
- [ ] **Mã sinh viên trùng đúng hoa/thường** → không tạo tài khoản; mã khác hoa/thường được chấp nhận theo quyết định case-sensitive.
- [ ] Offline khi submit → báo lỗi có thể thử lại; form giữ dữ liệu không nhạy cảm cần thiết.

## FR-02 — Đăng nhập/đăng xuất/session

- [ ] Đăng nhập đúng → vào `/notes`; restart app vẫn nhận session.
- [ ] **Mật khẩu sai** → ở `/sign-in`, không có session.
- [ ] Đăng xuất → cache profile/notes bị xóa; Back không vào route riêng tư.
- [ ] Chưa login mở `/profile` hoặc `/notes` → bị replace về `/sign-in`.
- [ ] **Token hết hạn** nhưng refresh token hợp lệ → refresh và tiếp tục; refresh không hợp lệ → logout an toàn.
- [ ] Offline khi app khôi phục session/login → không crash, báo trạng thái phù hợp.

## FR-03 — Quên/đặt lại mật khẩu

- [ ] Email tồn tại → nhận email có OTP 6 số và mở màn hình nhập mã trong app.
- [ ] Email không tồn tại → UI dùng cùng thông báo trung tính.
- [ ] Mật khẩu mới sai schema/confirm khác → không gọi update.
- [ ] OTP hợp lệ + mật khẩu mới hợp lệ → đổi thành công; mật khẩu cũ thất bại, mật khẩu mới đăng nhập được.
- [ ] **OTP sai, hết hạn hoặc đã dùng** → không đổi mật khẩu; có CTA yêu cầu mã mới.
- [ ] Offline khi gửi email hoặc cập nhật → báo lỗi/retry; không báo thành công giả.

## FR-04 — Hồ sơ và avatar

- [ ] Load/sửa `full_name`, `student_code` → reload vẫn đúng.
- [ ] Field vượt giới hạn / student code rỗng hoặc trùng đúng hoa/thường → dữ liệu cũ giữ nguyên.
- [ ] Upload JPEG/PNG/WEBP hợp lệ ≤2 MB → avatar mới hiển thị sau refresh.
- [ ] File sai MIME hoặc >2 MB → chặn; object/profile cũ không bị mất.
- [ ] Offline lúc cập nhật profile/avatar → báo retry, không hiển thị success giả.
- [ ] User A thử select/update profile hoặc select/upload/delete avatar của B → policy chặn.

## FR-05 — Notes và bằng chứng RLS

- [ ] A tạo title/content hợp lệ → list A có note, list B không có.
- [ ] Empty state có CTA tạo note; title rỗng/quá dài và content quá dài bị chặn.
- [ ] A sửa/xóa note A → cập nhật danh sách đúng; delete có confirm.
- [ ] Offline khi list/create/update/delete → error/retry, không mất nội dung form.
- [ ] Với session A, gọi SELECT nhắm row B → trả zero row/không lộ nội dung.
- [ ] Với session A, gọi INSERT có `user_id = B` → RLS từ chối.
- [ ] Với session A, gọi UPDATE row B và thử đổi note A thành `user_id = B` → RLS từ chối.
- [ ] Với session A, gọi DELETE row B → không xóa được; B vẫn đọc được row.
- [ ] Lặp lại kiểm tra chéo với B → kết quả đối xứng.

## Smoke test cuối

- [ ] Android và iOS/Expo Go mục tiêu: mở app, điều hướng toàn luồng không crash.
- [ ] Không thấy warning nghiêm trọng, secret, token hoặc password trong console/UI.
- [ ] `git diff --cached` không chứa key/token/password trước commit.
