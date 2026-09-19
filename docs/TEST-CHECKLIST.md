# Checklist bấm tay chụp ảnh báo cáo (v2.0.0, theme indigo)

## Cách ghi kết quả

Mỗi case đổi `[ ]` thành `[x]` khi đạt và thêm `YYYY-MM-DD | nền tảng |
tài khoản A/B | light/dark | đạt/lỗi + ghi chú ngắn`. Không ghi email thật,
mật khẩu hoặc token. Ảnh theme tím (trước v2.0.0) đã hết dùng được — chụp lại
toàn bộ với theme indigo (primary light `#505B92`, dark `#B9C3FF`).
Trước khi chụp: `npx tsc --noEmit`, `npm run lint`, `npm test` xanh.

Quy ước: Expo Go trên 1–2 máy thật; tài khoản demo A (và B cho case cách ly);
mỗi màn chụp cả light lẫn dark trừ khi ghi rõ.

## 1. Khởi động và dashboard

- [ ] Kill app → mở lại (chưa login) → dừng ở `/sign-in`, không nháy màn khác.
- [ ] Đăng nhập A → vào dashboard: 6 thẻ, thẻ 1 “Hoàn thành” tới `/notes`,
  thẻ 2 “Đang làm” tới `/documents`, 4 thẻ còn lại “Sắp có” (chụp light + dark).

## 2. Đăng nhập (`/sign-in`)

- [ ] Form rỗng light: không chữ trắng trên nền sáng (chụp).
- [ ] Nhập sai mật khẩu → lỗi tại màn, không vào app (chụp trạng thái lỗi).
- [ ] Đăng nhập đúng → vào dashboard; kill app mở lại vẫn còn session.

## 3. Đăng ký (`/sign-up`)

- [ ] Email sai định dạng / mật khẩu yếu / confirm lệch → lỗi ngay dưới ô (chụp).
- [ ] Đăng ký mới hợp lệ → user + profile tạo, vào app (dev) (chụp success).

## 4. Quên mật khẩu (`/forgot-password` → `/verify-reset-otp` → `/reset-password`)

- [ ] `/sign-in` bấm “Quên mật khẩu?” → sang `/forgot-password` (chụp).
- [ ] Nhập email A → nhận email Brevo in OTP 6 số, app sang màn nhập mã (chụp).
- [ ] Nhập sai 1 số → báo mã chưa đúng, ở lại màn hình (chụp).
- [ ] Nút “Gửi lại mã” khóa 60s có đếm ngược (chụp lúc đang khóa).
- [ ] Nhập đúng → đặt mật khẩu mới → về `/sign-in` kèm banner thành công (chụp).
- [ ] Kill app giữa luồng rồi mở lại: email điền sẵn + giữ cooldown (chụp).

## 5. Ghi chú (`/notes`, `/notes/new`, `/notes/[id]`)

- [ ] List có data light + dark (chụp cả hai).
- [ ] Empty state: icon lớn + câu dẫn + nút tạo (chụp).
- [ ] Tạo note mới → list cập nhật (chụp màn tạo + list sau tạo).
- [ ] Sửa note; xóa note có dialog xác nhận (chụp dialog).
- [ ] Lỗi mạng → có nút “Thử lại”; pull-to-refresh tải lại được.

## 6. Hồ sơ (`/profile`)

- [ ] Form đã điền + avatar hiển thị (chụp); chưa có avatar → fallback chữ cái đầu (chụp).
- [ ] Chạm avatar → mở thư viện ảnh; overlay camera luôn thấy được (chụp).
- [ ] Đổi mã sinh viên thành mã của B → Snackbar “Mã sinh viên này đã được sử dụng.” (chụp).
- [ ] Lưu thành công → Snackbar “Đã cập nhật hồ sơ.” (chụp).
- [ ] Card “Giao diện”: chọn Sáng/Tối/Hệ thống; nút theme trên Appbar đổi icon
  `theme-light-dark` → `weather-sunny` → `weather-night` theo ngay (chụp 3 mode).
- [ ] Từ chối quyền ảnh → Snackbar kèm nút “Mở Cài đặt” (chụp).

## 7. Đổi mật khẩu (`/profile/change-password`)

- [ ] Sai mật khẩu hiện tại → lỗi riêng; mật khẩu mới trùng cũ → bị chặn (chụp).
- [ ] Đổi đúng → banner thành công (chụp).

## 8. Tài liệu (`/documents`)

- [ ] List có data light + dark: tên + môn + dung lượng + ngày (chụp cả hai).
- [ ] Ô tìm kiếm: gõ đúng tên có dấu ra kết quả; gõ không dấu KHÔNG ra tên có
  dấu (giới hạn đã chốt — chụp cả hai để làm bằng chứng vấn đáp).
- [ ] Hàng Chip: Tất cả / từng môn / Chưa phân loại lọc đúng (chụp lúc lọc).
- [ ] Empty state: icon + câu dẫn + nút “Tải tài liệu lên” (chụp).
- [ ] Lỗi mạng → EmptyState lỗi + nút “Thử lại” (chụp).

## 9. Tải lên (`/documents/upload`)

- [ ] Chọn PDF hợp lệ → tải lên → về danh sách kèm Snackbar “Đã tải tài liệu
  lên.” (chụp màn upload + Snackbar).
- [ ] Lặp lại với 1 DOCX + 1 TXT (chụp danh sách có cả ba).
- [ ] Tệp quá 10 MB → chặn trước khi đọc, báo rõ giới hạn (chụp).
- [ ] Tệp sai định dạng (ảnh/zip) → từ chối + liệt kê PDF/DOCX/TXT (chụp).
- [ ] Hủy picker giữa chừng → ở yên, không báo lỗi giả.

## 10. Chi tiết (`/documents/[id]`)

- [ ] Hiện đúng tên/ngày/dung lượng/định dạng/môn/trạng thái trích xuất
  (chụp light + dark).
- [ ] PDF/TXT hiện “Chưa xử lý”; DOCX hiện “Không hỗ trợ” + Banner gợi ý
  chuyển sang PDF (chụp cả hai).
- [ ] Bấm “Mở tài liệu” → file mở ra app ngoài (chụp app ngoài đang mở file).
- [ ] Đổi tên rỗng/quá 120 ký tự → lỗi dưới ô, tên cũ giữ nguyên (chụp).
- [ ] Đổi tên đúng → Snackbar “Đã đổi tên.” (chụp).
- [ ] Đổi môn học tại đây (danh sách không có menu này) → Snackbar “Đã đổi
  môn học.” (chụp).
- [ ] Bấm “Xóa tài liệu” → dialog xác nhận; Hủy → không mất gì; xác nhận →
  về danh sách, mất cả DB lẫn Storage (chụp dialog).

## 11. Môn học (`/subjects`)

- [ ] Tạo môn trùng tên → lỗi dưới ô nhập (chụp).
- [ ] Xóa môn đang có N tài liệu → dialog ghi rõ “N tài liệu sẽ chuyển thành
  Chưa phân loại”; xác nhận → tài liệu còn nguyên ở “Chưa phân loại” (chụp dialog).
- [ ] Tạo tới trần 30 môn → môn thứ 31 báo rõ giới hạn (chụp nếu đã tới trần).

## 12. Theme và dark mode tổng thể

- [ ] Nút theme Appbar: bấm cycle Hệ thống → Sáng → Tối → Hệ thống, hai màn
  phản ánh cùng trạng thái ngay.
- [ ] Chọn “Hệ thống” rồi đổi dark/light trong Settings điện thoại → app đổi
  theo không cần chạm lại app.
- [ ] Kill app → mở lại: giữ lựa chọn, không nháy sáng→tối lúc khởi động.
- [ ] Duyệt hết màn ở light mode: không chữ trùng nền, icon hiện đủ (không ô trống).

## 13. Cách ly A/B trên 2 máy (chụp cặp song song nếu được)

- [ ] A tạo note/tài liệu → chỉ máy A thấy; B tạo → chỉ máy B thấy.
- [ ] Kill app cả 2 máy → mở lại, mỗi máy vẫn chỉ thấy dữ liệu của mình.
- [ ] Dashboard Table Editor: `profiles`/`study_notes`/`subjects`/`documents`
  hiện RLS enabled; bucket `avatars` + `documents` private (chụp, che ref/key/email).

## Tự động (không cần mạng, không cần thiết bị)

Test được thuần túy: schema zod tên tài liệu (1–120 sau chuẩn hóa) và tên
môn học (1–60, không trùng); kiểm tra whitelist phần mở rộng (`pdf`, `docx`,
`txt`, lowercase, tệp không ext bị từ chối); kiểm tra giới hạn 10 MB
(10 × 1024 × 1024 byte, vượt/bằng/dưới ngưỡng); hàm format dung lượng
(B/KB/MB); hàm dựng đường dẫn object `{user_id}/{uuid}.{ext}`; hàm suy loại
tệp từ ext; map trạng thái `extraction_status` sang nhãn tiếng Việt.

Phải mock (không gọi mạng thật): supabase client (Postgres + Storage),
`expo-document-picker` (asset giả gồm uri/name/size/mimeType),
`expo-file-system` API mới (`File`). Test không được chạm network.

## Kịch bản rls-proof cho documents và subjects (chưa có script — ghi nợ)

Theo đúng khuôn `scripts/rls-proof.ts` của FR-05 (2 user test A/B, tự dọn):

- `documents`: A SELECT/INSERT/UPDATE/DELETE row của A được; A SELECT row của
  B trả 0 dòng; A INSERT với `user_id = B`, UPDATE/DELETE row B đều bị RLS
  từ chối; B đối xứng.
- `subjects`: tương tự cho CRUD môn học của A/B.
- Storage `documents`: A upload vào `{A}/` được; A không download/không tạo
  signed URL được object trong `{B}/`; anon không đọc/không list.
- Thoát criteria: script exit 0, log số check pass đầy đủ.

## Smoke test cuối

- [ ] Android và iOS/Expo Go mục tiêu: mở app, điều hướng toàn luồng không crash.
- [ ] Không thấy warning nghiêm trọng, secret, token hoặc password trong console/UI.
- [ ] `git diff --cached` không chứa key/token/password trước commit.
