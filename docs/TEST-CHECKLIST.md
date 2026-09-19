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

## CN2 — Tài liệu học tập (FR-06 → FR-13)

### Tự động (không cần mạng, không cần thiết bị)

Test được thuần túy: schema zod tên tài liệu (1–120 sau chuẩn hóa) và tên
môn học (1–60, không trùng); kiểm tra whitelist phần mở rộng (`pdf`, `docx`,
`txt`, lowercase, tệp không ext bị từ chối); kiểm tra giới hạn 10 MB
(10 × 1024 × 1024 byte, vượt/bằng/dưới ngưỡng); hàm format dung lượng
(B/KB/MB); hàm dựng đường dẫn object `{user_id}/{uuid}.{ext}`; hàm suy loại
tệp từ ext; map trạng thái `extraction_status` sang nhãn tiếng Việt.

Phải mock (không gọi mạng thật): supabase client (Postgres + Storage),
`expo-document-picker` (asset giả gồm uri/name/size/mimeType),
`expo-file-system` API mới (`File`). Test không được chạm network.

### Kịch bản rls-proof cho documents và subjects

Theo đúng khuôn `scripts/rls-proof.ts` của FR-05 (2 user test A/B, tự dọn):

- `documents`: A SELECT/INSERT/UPDATE/DELETE row của A được; A SELECT row của
  B trả 0 dòng; A INSERT với `user_id = B`, UPDATE/DELETE row B đều bị RLS
  từ chối; B đối xứng.
- `subjects`: tương tự cho CRUD môn học của A/B.
- Storage `documents`: A upload vào `{A}/` được; A không download/không tạo
  signed URL được object trong `{B}/`; anon không đọc/không list.
- Thoát criteria: script exit 0, log số check pass đầy đủ.

### Thủ công trên Expo Go (từng FR)

#### CN2-G1 — Upload + danh sách (FR-06, FR-07, FR-08 khung; chủ dự án chạy)

- [ ] Dashboard: thẻ “Quản lý tài liệu học tập” hiện chip “Đang làm” (không phải “Sắp có”), bấm vào sang `/documents` không crash, ở cả light/dark.
- [ ] `/documents` khi chưa có tài liệu: đủ icon lớn + câu dẫn + nút “Tải tài liệu lên” (cấm chỉ in “Không có dữ liệu”); bấm nút sang `/documents/upload`.
- [ ] FR-06/FR-07: `/documents/upload` → “Chọn tệp” → chọn PDF hợp lệ → “Tải lên” → về `/documents` kèm Snackbar “Đã tải tài liệu lên.”, danh sách có tài liệu mới (mới nhất trước).
- [ ] Lặp lại với 1 tệp DOCX và 1 tệp TXT hợp lệ → cả hai lên được.
- [ ] Tệp quá 10 MB → chặn trước khi đọc, báo rõ giới hạn 10 MB, không tạo object/bản ghi nào.
- [ ] Tệp sai định dạng (VD ảnh, zip) hoặc MIME lệch ext → từ chối + liệt kê định dạng được hỗ trợ (PDF, DOCX, TXT).
- [ ] Tên tệp tiếng Việt có dấu, khoảng trắng thừa → danh sách hiển thị tên đã chuẩn hóa; object storage là UUID (kiểm tra qua Table Editor/Storage Dashboard).
- [ ] Hủy picker giữa chừng → im lặng ở lại màn upload, không báo lỗi giả.
- [ ] Mất mạng khi tải lên → báo lỗi + nút “Tải lên” bấm lại được, không có bản ghi nửa vời (không bản ghi thiếu object).
- [ ] FR-08: mỗi dòng hiện tên hiển thị + “Chưa phân loại” + kích thước (B/KB/MB) + ngày tải; pull-to-refresh tải lại được; lỗi mạng có nút “Thử lại”.
- [ ] Đăng xuất rồi đăng nhập lại → danh sách tài liệu còn nguyên, chỉ thấy tài liệu của mình.
- [ ] Không thêm dependency nào ngoài `expo-crypto` ở G1; nếu G1 phải thêm, ghi lý do vào DEVLOG (hiện tại: không thêm).

#### CN2-G2/G3 — phần còn lại (chưa làm, giữ nguyên)

- [ ] FR-06/FR-07: tải PDF/DOCX/TXT hợp lệ → lên được, danh sách có mới.
- [ ] Tệp quá 10 MB → chặn trước khi đọc, báo rõ giới hạn, không tạo gì.
- [ ] Tệp sai định dạng (VD ảnh, zip) hoặc MIME lệch ext → từ chối + liệt kê
      định dạng được hỗ trợ.
- [ ] Tên tệp tiếng Việt có dấu, khoảng trắng thừa, rất dài → chuẩn hóa đúng,
      object storage là UUID không dấu.
- [ ] Mất mạng giữa chừng khi tải lên → báo lỗi + retry, không có bản ghi
      nửa vời (không bản ghi thiếu object).
- [ ] FR-08: danh sách chỉ tài liệu của mình, mới nhất trước; empty state đủ
      icon + câu dẫn + nút tải lên.
- [ ] Ô tìm kiếm theo tên: gõ đúng tên ra kết quả; gõ không dấu không ra tên
      có dấu (phân biệt dấu đã biết); xóa ô tìm kiếm về lại toàn danh sách.
- [ ] Vượt 100 tài liệu hoặc 30 môn học → báo lỗi rõ ràng, không chèn thêm.
- [ ] FR-09: chi tiết hiện đúng tên/ngày/dung lượng/định dạng/môn/trạng thái;
      nút “Mở tài liệu” mở được file ngoài app.
- [ ] Đổi môn học chỉ làm được ở màn chi tiết; màn danh sách không có menu đổi.
- [ ] FR-10: đổi tên sai (rỗng/quá dài) bị chặn, tên cũ giữ nguyên; đổi đúng
      thì object storage không đổi.
- [ ] FR-11: hủy dialog thì không xóa gì; xác nhận thì mất cả DB lẫn object.
- [ ] FR-12: tạo môn trùng tên bị chặn; xóa môn đang có tài liệu → tài liệu về
      “Chưa phân loại”, không mất file nào.
- [ ] FR-13: PDF/TXT mới hiện “Chưa xử lý”; DOCX hiện “Không hỗ trợ” + gợi ý
      chuyển sang PDF.
- [ ] Đăng xuất rồi đăng nhập lại → dữ liệu tài liệu/môn học còn nguyên.

### Kiểm tra giao diện CN2

- [ ] Mỗi màn (`/documents`, `/documents/upload`, `/documents/[id]`,
      `/subjects`) ở cả light và dark: skeleton/empty/error/success đúng
  DESIGN-SYSTEM, không hardcode màu, không chữ trùng nền.
- [ ] Cặp màu file-type mới đã đo tương phản ≥ 4.5:1 bằng công cụ, ghi kết quả
      vào đây.

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
