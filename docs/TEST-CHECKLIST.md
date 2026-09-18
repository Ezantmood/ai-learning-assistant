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

- [ ] `/sign-in` hiện link “Quên mật khẩu?” → sang `/forgot-password`.
- [ ] Email tồn tại → nhận email có OTP 6 số (template in `{{ .Token }}`; server để “Email OTP length” = 6) và sang màn hình nhập mã trong app.
- [ ] **Email không tồn tại** → UI dùng cùng thông báo trung tính, không tiết lộ email có đăng ký hay không.
- [ ] Ô OTP là 1 ô numeric tự focus, nhập tay/paste/dán từ email đều được; mã khác 6 số bị chặn ngay tại field.
- [ ] Nút gửi lại mã khóa 60 giây có đếm ngược (`Gửi lại mã sau Xs`), disable trong lúc chờ; hết 60s mới gọi lại API (chống spam).
- [ ] **Vượt quota gửi email (100/giờ)** → thông báo rõ giới hạn, không crash, nút hết loading và bấm lại được.
- [ ] **OTP sai** → thông báo riêng; **OTP hết hạn** → thông báo riêng + CTA gửi lại mã; **mã đã dùng** → thông báo riêng (lưu ý: Supabase gộp sai/hết hạn/đã dùng thành một mã `Token has expired or is invalid` nên case dùng lại thường rơi vào nhánh hết hạn, vẫn có CTA gửi mã mới).
- [ ] **Thoát app giữa luồng rồi mở lại**: trước verify → email được điền sẵn ở cả hai màn hình + cooldown được giữ; sau verify (recovery session còn hạn) → vào thẳng `/reset-password` để đặt mật khẩu.
- [ ] Mật khẩu mới sai schema/confirm khác → lỗi tại field, không gọi update.
- [ ] OTP hợp lệ + mật khẩu mới hợp lệ → về `/sign-in` kèm banner thành công; mật khẩu cũ thất bại, mật khẩu mới đăng nhập được.
- [ ] Offline khi gửi email/xác minh/cập nhật → báo lỗi mạng + retry; form giữ dữ liệu; không báo thành công giả, không treo loading.
- [ ] `/profile/change-password` khi đã đăng nhập: sai mật khẩu hiện tại → lỗi riêng; mật khẩu mới trùng cũ → bị chặn; đúng → banner thành công.

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

## Demo thủ công trên 2 điện thoại thật (G5 — chủ dự án tự chạy)

Quy ước: máy A đăng nhập tài khoản A, máy B đăng nhập tài khoản B. Ghi kết quả
theo mẫu `YYYY-MM-DD | iOS/Android + Expo Go | A/B | đạt/lỗi + ghi chú ngắn`.

### FR-05 — Cách ly study_notes A/B

- [ ] A tạo note “Note của A” → list máy A có, kéo refresh list máy B không có.
- [ ] B tạo note “Note của B” → list máy B có, list máy A không có.
- [ ] A sửa tiêu đề note A → máy A cập nhật, máy B không đổi.
- [ ] A xóa note A (xác nhận dialog) → máy A mất, máy B không đổi.
- [ ] Kill app cả 2 máy rồi mở lại → mỗi máy vẫn chỉ thấy note của mình (session + RLS).

### FR-03 — OTP 6 số qua email Brevo

- [ ] Máy A: `/sign-in` → “Quên mật khẩu?” → nhập email A → nhận email Brevo in OTP 6 số (template `{{ .Token }}`), app sang màn hình nhập mã.
- [ ] Nhập sai 1 số → báo “Mã OTP chưa đúng”, ở lại màn hình nhập.
- [ ] Nhập đúng 6 số → sang đặt mật khẩu mới → về `/sign-in` kèm banner; mật khẩu cũ thất bại, mật khẩu mới đăng nhập được.
- [ ] Nút “Gửi lại mã” khóa 60s có đếm ngược; hết 60s mới gửi được tiếp.

### FR-04 — Đổi avatar + hồ sơ

- [ ] Máy A mở `/profile` → thấy email A, họ tên, mã sinh viên, avatar hiện tại (hoặc chữ cái đầu nếu chưa có).
- [ ] Sửa họ tên → Lưu → Snackbar “Đã cập nhật hồ sơ.”, kill app mở lại vẫn đúng.
- [ ] Đổi mã sinh viên thành mã của B → Snackbar “Mã sinh viên này đã được sử dụng.”, dữ liệu cũ giữ nguyên.
- [ ] “Đổi avatar” → cấp quyền ảnh → crop 1:1 → avatar mới hiển thị; máy B không thấy avatar A.
- [ ] Từ chối quyền ảnh → Snackbar hướng dẫn mở Cài đặt kèm nút “Mở Cài đặt”.
- [ ] A thử xem/sửa profile B (nếu biết cách gọi API) → RLS chặn; đã chứng minh tự động bằng `scripts/storage-rls-proof.ts` 5/5 PASS.

## Smoke test cuối

- [ ] Android và iOS/Expo Go mục tiêu: mở app, điều hướng toàn luồng không crash.
- [ ] Không thấy warning nghiêm trọng, secret, token hoặc password trong console/UI.
- [ ] `git diff --cached` không chứa key/token/password trước commit.

## G6 — Kiểm tra thủ công UI (chủ dự án chạy trên máy thật)

- [ ] Icon hiện đủ mọi màn hình (không còn ô trống): auth (email/lock/eye),
  OTP (numeric/refresh/check), profile (camera/content-save/lock-reset/logout),
  notes (note-text/plus). Icon rỗng = tên sai hoặc cầu nối settings.icon vỡ.
- [ ] Dark mode: bật tối hệ điều hành → nền/tên nút/snackbar đổi theo;
  `StatusBar` chữ sáng; tắt → về sáng. Không kẹt một theme.
- [ ] Bàn phím không che input: focus từng ô (mật khẩu, OTP, nội dung note)
  → ô vẫn nhìn thấy; bấm icon mắt không nhảy focus/crash.
- [ ] Tap avatar ở `/profile` → mở thư viện ảnh (không phải đoán); overlay
  camera luôn thấy được cả khi chưa có avatar (fallback chữ cái đầu).

## G7 — Kiểm tra thủ công theme switcher (chủ dự án chạy trên máy thật)

- [ ] Nút theme trên Appbar Notes và Profile: bấm cycle Hệ thống → Sáng →
  Tối → Hệ thống; icon đổi `theme-light-dark` → `weather-sunny` →
  `weather-night`; hai màn phản ánh cùng trạng thái ngay.
- [ ] `Card` “Giao diện” trong Profile: chọn Sáng/Tối/Hệ thống →
  nút Appbar đổi icon theo ngay; kill app mở lại vẫn giữ lựa chọn.
- [ ] Chọn “Hệ thống” rồi đổi dark/light trong Settings điện thoại → app
  đổi theo mà không cần chạm lại app.
- [ ] Đổi mode → kill app → mở lại: không nháy sáng→tối lúc khởi động.
- [ ] Duyệt hết màn ở light mode, không có chữ trùng màu nền: Đăng nhập,
  Đăng ký, Quên mật khẩu, Xác minh OTP, Đặt mật khẩu mới, Notes (có data +
  empty + skeleton), Profile (có avatar + fallback chữ cái đầu), Snackbar
  success/error, FAB, Appbar, Dialog xác nhận xóa, Banner, Đổi mật khẩu.
