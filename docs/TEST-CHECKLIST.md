# Checklist bấm tay chụp ảnh báo cáo (v2.0.0, theme indigo)

## Cách ghi kết quả

Mỗi case đổi `[ ]` thành `[x]` khi đạt và thêm `YYYY-MM-DD | nền tảng |
tài khoản A/B | light/dark | đạt/lỗi + ghi chú ngắn`. Không ghi email thật,
mật khẩu hoặc token. Ảnh theme tím (trước v2.0.0) đã hết dùng được — chụp lại
toàn bộ với theme indigo (primary light `#505B92`, dark `#B9C3FF`).
Trước khi chụp: `npx tsc --noEmit`, `npm run lint`, `npm test` xanh.

Quy ước: Expo Go trên 1–2 máy thật; tài khoản demo A (và B cho case cách ly);
mỗi màn chụp cả light lẫn dark trừ khi ghi rõ.

## 0. Tiền-kiểm trước buổi bảo vệ (làm trước khi bấm bất kỳ case nào)

- [ ] Mạng: KHÔNG dùng wifi trường/công cộng (client isolation chặn Expo Go
  thấy dev server dù "cùng mạng"). Điện thoại phát hotspot, Mac nối vào
  hotspot đó, rồi `npx expo start -c` và quét QR mới. KHÔNG dùng `--tunnel`.
- [ ] Supabase còn thức: free tier tự pause sau ~7 ngày không dùng. Mở
  Dashboard project còn responding, hoặc chạy `GET <SUPABASE_URL>/auth/v1/health`
  (thức = trả HTTP 401 nhanh; pause = timeout/503). Pause thì bấm Resume trong
  Dashboard rồi đợi sẵn sàng mới demo.

## 1. Khởi động và dashboard

- [ ] Kill app → mở lại (chưa login) → dừng ở `/sign-in`, không nháy màn khác.
- [ ] Đăng nhập A → vào dashboard: 6 thẻ, thẻ 1→4 “Hoàn thành” (thẻ 1
  tới `/notes`, thẻ 2→4 tới `/documents`), 2 thẻ còn lại “Sắp có”
  (chụp light + dark).

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

- [ ] Android Expo Go: chọn tệp TXT nhỏ từ trình chọn tệp, bấm Tải lên,
  xác nhận không còn `DocumentFileReadError`, tài liệu có trong danh sách và
  tệp gốc vẫn mở được trong ứng dụng quản lý tệp.
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

CN3-G1 (đã khóa bằng unit, 25 test mới trong tổng 20 suites 212/212):
transport `summarizeWithGemini` (mock `fetch`: PDF base64 inline + prompt
tiếng Việt, TXT text trực tiếp, cấm temperature/top_p/top_k, map 429/5xx/
mất mạng/thiếu key/trả rỗng); `requestSummary` (mock supabase + transport:
PDF thành công đúng một request, DOCX → `unsupported` không gọi Gemini,
document người khác → từ chối không chạm DB, Gemini 429 → `failed` + câu
hạn mức, `processing` còn hạn → chặn, treo > 15 phút → thu hồi rồi chạy
tiếp, TXT lưu `extracted_text`, quá 20.000 ký tự → báo rõ).

## Kịch bản rls-proof cho documents và subjects (chưa có script — ghi nợ)

Theo đúng khuôn `scripts/rls-proof.ts` của FR-05 (2 user test A/B, tự dọn):

- `documents`: A SELECT/INSERT/UPDATE/DELETE row của A được; A SELECT row của
  B trả 0 dòng; A INSERT với `user_id = B`, UPDATE/DELETE row B đều bị RLS
  từ chối; B đối xứng.
- `subjects`: tương tự cho CRUD môn học của A/B.
- Storage `documents`: A upload vào `{A}/` được; A không download/không tạo
  signed URL được object trong `{B}/`; anon không đọc/không list.
- Thoát criteria: script exit 0, log số check pass đầy đủ.

## 14. Tóm tắt AI (`/documents/[id]` vùng tóm tắt — CN3-G2 xong code + unit, chờ test tay)

> G1 (2026-09-20): logic `requestSummary`/transport/model đã khóa bằng unit
> test (mock, không gọi mạng): PDF thành công, DOCX → `unsupported` không gọi
> Gemini, document người khác → từ chối, Gemini lỗi → `failed`.
> G2 (2026-09-20, session `cn3g2-cn4`): vùng UI `summary-section.tsx` +
> loader `source.ts` (signed URL → cache → PDF base64/TXT text, API mới,
> dọn cache best-effort) khóa bằng 8 test `source.test.ts` (mock, không gọi
> mạng): PDF/TXT OK, DOCX chặn trước mạng, signed URL lỗi, offline, TXT
> rỗng, dọn cache fail không hỏng kết quả. Tổng 23 suites 240/240 (giữ
> nguyên test cũ). Các case tay dưới đây thuộc chủ dự án (Expo Go,
> light/dark).

- [ ] Sau khi điền `EXPO_PUBLIC_GEMINI_API_KEY` trong `.env.local`, dừng
  Metro, chạy `npx expo start --clear` từ gốc repo; log `env: export` có tên
  biến, mở lại Expo Go và bấm tóm tắt không còn lỗi “Chưa cấu hình”. Không
  chụp/in giá trị key.
- [ ] PDF của mình bấm “Tóm tắt bằng AI” → spinner, nút disabled → hiện bản
  tóm tắt tiếng Việt; bấm dồn lúc đang chạy không sinh request thứ hai.
- [ ] DOCX: nút tóm tắt ẩn + Banner gợi ý chuyển sang PDF; không có request AI.
- [ ] Tóm tắt lại khi đã có bản → bản cũ bị ghi đè (một bản duy nhất).
- [ ] Bật chế độ máy bay rồi bấm → lỗi tiếng Việt + “Thử lại”, trạng thái về
  `failed`, không kẹt spinner.
- [ ] Kill app giữa lúc đang tóm tắt → mở lại sau 15 phút thấy `failed` + cho
  thử lại (thu hồi `processing` treo).
- [ ] Chạm quota free → banner hạn mức + giờ reset, không tự retry.
- [ ] A tóm tắt → B không thấy bản của A (cách ly RLS `document_summaries`).

## 15. Vỏ ứng dụng — tabs và lối lùi (fix/app-shell, Expo Go)

- [ ] Đăng nhập → vào tab Trang chủ (3 tab dưới cùng: Trang chủ / Tài liệu /
  Tài khoản, icon hiện đủ, không ô trống).
- [ ] Chuyển tab Trang chủ ↔ Tài liệu ↔ Tài khoản: mỗi tab giữ đúng màn gốc,
  không crash, không mất session.
- [ ] Tab Tài khoản → nút “Ghi chú học tập” → `/notes` có nút back (Appbar);
  bấm back về tab Tài khoản.
- [ ] Từ Trang chủ → thẻ CN1 → `/notes` → chi tiết → back từng bước về đúng chỗ.
- [ ] Từ `/notes` mới tạo → back về list (không kẹt ở màn tạo).
- [ ] Nút Back cứng Android ở mọi màn con (`/notes/new`, `/notes/[id]`,
  `/documents/upload`, `/documents/[id]`, `/subjects`,
  `/profile/change-password`, `/sign-up`, OTP): lùi đúng một bước, không văng
  app, không kẹt.
- [ ] Tab Tài khoản → Đăng xuất → về `/sign-in`; nút Back (cứng + Appbar) sau
  đó không quay lại được màn riêng tư.
- [ ] Kill app khi đang login → mở lại còn phiên, vào thẳng tab Trang chủ.
- [ ] Kill app khi chưa login → mở lại dừng ở `/sign-in`.

## 16. Hỏi đáp AI (`/documents/[id]` vùng hỏi đáp — CN4 xong code + unit, migration 0005 chờ apply tay, còn lại test tay)

> Session `cn3g2-cn4` (2026-09-20): SPEC gốc không có FR-23→FR-30 nên hành
> vi theo lệnh session (ô nhập trên cùng màn chi tiết, nhồi
> `extracted_text` vào prompt, cấm RAG/chunking, chặn hỏi khi chưa có
> text). Unit đã khóa (mock, không gọi mạng): `askTransport.test.ts`
> 7 test (prompt chứa context + câu hỏi, 429/5xx/mạng/trả rỗng, cấm
> temperature/key lộ) + `chat.test.ts` 13 test (hỏi OK đúng một request +
> insert, chặn khi chưa có text/DOCX/sai chủ/rỗng/quá 500, quota không
> insert, đáp quá 20.000 không insert, lịch sử desc, map lỗi). Tổng
> 23 suites 240/240 (giữ nguyên test cũ).
> Giới hạn đã biết: PDF do Gemini đọc trực tiếp (native vision) nên
> `extracted_text` vẫn null sau tóm tắt → hỏi đáp PDF bị chặn với câu
> dẫn; hỏi đáp hiện dùng được với TXT sau khi tóm tắt.

- [ ] Áp migration: dán TOÀN BỘ `supabase/migrations/0005_cn4_questions.sql`
  vào SQL Editor → Run (không `db push`); rồi chạy
  `PROBE_EMAIL=... PROBE_PASSWORD=... node scripts/cn4-schema-verify.mjs`
  → kỳ vọng `SIGNIN_OK` + `VERIFY_PASS` (thiếu cột → `42703` là fail thật).
- [ ] TXT đã tóm tắt: nhập câu hỏi → spinner, nút “Hỏi” disabled → đáp án
  hiện trong lịch sử, ô nhập trống; hỏi dồn lúc đang chạy không sinh
  request thứ hai.
- [ ] Chưa tóm tắt (TXT mới tải): vùng hỏi đáp hiện “Chưa thể hỏi đáp” +
  câu dẫn bấm tóm tắt trước; không có ô nhập bị treo.
- [ ] DOCX: Banner gợi ý PDF của CN2 vẫn hiện; vùng tóm tắt ẩn nút, vùng
  hỏi đáp chặn; không có request AI nào.
- [ ] Câu hỏi rỗng/quá 500 ký tự → lỗi nằm dưới ô nhập, giữ nguyên câu hỏi.
- [ ] Bật chế độ máy bay rồi hỏi → lỗi tiếng Việt + “Thử lại”, không tạo
  row nửa vời trong lịch sử.
- [ ] Chạm quota free → banner hạn mức, không có nút thử lại, không tự retry.
- [ ] Hỏi rồi xóa tài liệu → lịch sử mất theo (CASCADE); A hỏi → B không
  thấy (cách ly RLS `document_questions`, proof A/B ở phiên sau).

## Smoke test cuối

- [ ] Android và iOS/Expo Go mục tiêu: mở app, điều hướng toàn luồng không crash.
- [ ] Không thấy warning nghiêm trọng, secret, token hoặc password trong console/UI.
- [ ] `git diff --cached` không chứa key/token/password trước commit.

## 17. Quét hình ảnh đề bài bằng AI (`/scan`, CN5)

> Migration 0006 đã `VERIFY_PASS` và bucket đủ 8 MIME. Các case dưới đây
> cần bấm trên Expo Go (Android, thêm iOS nếu có); ghi ngày, thiết bị và
> light/dark theo quy ước đầu file. Không chụp key/token.
> 2026-09-22: chủ dự án đã bấm camera và quét; có lượt thành công, có lượt
> Gemini trả HTTP 503. Chạy lại bản code sau tối ưu OCR (`thinkingLevel`
> minimal, `mediaResolution` medium) và ghi thời gian + độ chính xác chữ
> nhỏ ở ảnh thật trước khi tick các case liên quan.
> Bản tiếp theo cho update `processing` và request AI chạy đồng thời sau
> khi tạo row; đo lại thời gian tổng, nhất là khi Supabase phản hồi chậm.
> 2026-09-22: chủ dự án xác nhận đã chụp camera và quét thành công trên
> Expo Go, đồng ý đóng CN5-05. Chưa ghi nhận loại thiết bị, theme hay thời
> gian từng lượt. Các ô dưới đây chưa được tick vì chưa có kết quả đầy đủ
> từng ca; dự kiến đo lại tốc độ và kiểm độ chính xác ảnh thật ngày 2026-09-23.

- [ ] Dashboard CN5 “Hoàn thành” → mở `/scan`; nút back về Trang chủ,
  mở `/scan` trực tiếp vẫn có đường về. Icon hiển thị đủ ở light/dark.
- [ ] Empty “Chưa có kết quả” → chọn PNG/JPEG/WEBP/HEIC từ thư viện:
  xem trước ảnh, chưa gửi AI cho tới khi bấm “Quét”. Hủy picker im lặng.
- [ ] Chọn GIF → thông báo tiếng Việt, không tạo row `documents`/request AI.
  Chọn ảnh quá 10 MB hoặc không đọc được → báo rõ, không upload.
- [ ] Camera: cấp quyền → chụp → xem trước → quét. Từ chối tạm → có thông
  báo; từ chối vĩnh viễn → nút “Mở Cài đặt”. Android bật “Don't keep
  activities” rồi chụp để kiểm tra `getPendingResultAsync()` cứu ảnh.
- [ ] Bấm “Quét” với ảnh đề bài rõ → spinner + nút disabled; bấm dồn không
  có request thứ hai; xong hiện toàn văn OCR tiếng Việt. Kiểm tra row mới
  `documents` có `.jpg`, `image/jpeg`, `extracted_text`, `done`.
- [ ] Ảnh mờ/không chữ/không phải đề bài → thông báo tiếng Việt + “Thử lại”,
  row `failed` không ghi text rỗng đè lên bản cũ. OCR cắt cụt (nếu tái hiện
  được) → phần cứu được hiện kèm cảnh báo, row `done`.
- [ ] Bật chế độ máy bay rồi quét → lỗi mạng + “Thử lại”; quota 429 (nếu gặp)
  → banner hạn mức, không tự retry. Kill app lúc `processing`, sau 15 phút
  mở lại → row chuyển `failed`.
- [ ] A quét ảnh → đăng nhập B không thấy kết quả của A; proof Data API A/B
  trong CN5-05 kiểm đủ SELECT/INSERT/UPDATE/DELETE.
