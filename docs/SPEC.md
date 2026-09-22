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
| FR-09 | Xem thông tin tài liệu | **Given** đang ở chi tiết một tài liệu của mình, **When** xem, **Then** thấy tên hiển thị, ngày tải lên, kích thước (định dạng KB/MB), định dạng tệp, môn học (hoặc “Chưa phân loại”) và trạng thái trích xuất nội dung. Nút “Mở tài liệu” gọi `Linking.openURL(signedUrl)` (tiện ích ngoài FR, mức tối thiểu — xem quyết định CN2-4 bên dưới). |
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
- Giới hạn số lượng mỗi user: tối đa 100 tài liệu và 30 môn học. Kiểm tra bằng `count` trước khi insert; vượt thì báo lỗi rõ ràng, không chèn im lặng. Lý do: Supabase free tier chỉ có 1 GB storage mà mỗi tệp tới 10 MB — 100 tệp đã chạm trần.
- Tìm kiếm: đúng một ô tìm kiếm theo tên tài liệu ở màn danh sách, dùng `ilike`. Đây là ngoại lệ có chủ đích với luật cấm mở rộng phạm vi, lý do: chất lượng demo. Giới hạn đã biết: tìm kiếm PHÂN BIỆT DẤU tiếng Việt, vì hàm `unaccent` của Postgres không immutable nên không đánh index trực tiếp được; không bật extension `unaccent` ở giai đoạn này.
- Đổi môn học của tài liệu CHỈ ở màn chi tiết; màn danh sách chỉ hiển thị và lọc, không có menu đổi nhanh.

### Quy tắc dữ liệu CN2

- `subjects`: một row thuộc về một user (`user_id`); chứa `name`; xóa môn học đang có tài liệu thì tài liệu về “Chưa phân loại” (`ON DELETE SET NULL`), không xóa theo.
- `documents`: chứa `user_id`, `subject_id` (nullable), `display_name`, `storage_path` (`{user_id}/{uuid}.{ext}`), `file_ext`, `mime_type`, `file_size`, `extracted_text` (nullable), `extraction_status`, timestamp.
- Tên file trên storage là UUID, không dùng tên gốc (tên gốc có dấu/khoảng trắng/ký tự lạ và có thể trùng). DB lưu tên gốc làm nhãn hiển thị.
- Đổi tên (FR-10) chỉ đổi nhãn trong DB, tuyệt đối không đổi tên object trên storage.
- Xóa (FR-11) phải xóa cả bản ghi DB lẫn object storage; thứ tự và xử lý lỗi giữa chừng xem `docs/ARCHITECTURE.md`.
- Bucket `documents` PRIVATE; DB chỉ lưu đường dẫn, không lưu URL; xem/tải bằng signed URL TTL 3600s.

### OUT OF SCOPE của CN2 (đề không yêu cầu)

Thùng rác/khôi phục, đánh dấu yêu thích, thống kê, dọn file mồ côi, chia sẻ tài liệu, đổi file gốc sau khi tải lên, quan hệ nhiều-nhiều giữa tài liệu và môn học.

### Quyết định bổ sung của chủ dự án (sau đặc tả, không sửa FR)

- CN2-1: KHÔNG làm viewer trong app. Nút “Mở tài liệu” gọi `Linking.openURL(signedUrl)` — `Linking` nằm trong `react-native` core, không thêm package. Lý do: đề FR-06→FR-13 không yêu cầu xem nội dung tài liệu; WebView trên Android không render được PDF, phải nhờ dịch vụ bên thứ ba. Đây là tiện ích ngoài phạm vi FR, làm ở mức tối thiểu.
- CN2-2: CÓ ô tìm kiếm theo tên (ngoại lệ mở rộng phạm vi vì chất lượng demo), xem luật ở trên.
- CN2-3: Giới hạn 100 tài liệu / 30 môn mỗi user, xem luật ở trên.
- CN2-4: Đổi môn học chỉ ở màn chi tiết, xem luật ở trên.

### CN3 — AI tóm tắt tài liệu (FR-14 → FR-22)

> Lưu ý nguồn: đề gốc trong repo chỉ liệt kê tên Chức năng 3 (“AI tóm tắt tài
> liệu PDF”, FR-14 → FR-22) mà không kèm nội dung từng FR; tag `edge-probe`
> cũng không tồn tại local lẫn remote ở thời điểm viết. Bảng dưới là diễn giải
> do session `docs/cn3` đề xuất từ hạ tầng CN2 (`extracted_text`,
> `extraction_status`) và 7 quyết định đã chốt bên dưới. Nếu đề gốc khác, sửa
> bảng này trước, không sửa code theo bảng cũ.

| FR | Yêu cầu | Acceptance criteria (Given / When / Then) |
|----|---------|-------------------------------------------|
| FR-14 | Tóm tắt tài liệu PDF/TXT của mình bằng Gemini 3.5 Flash | **Given** đã đăng nhập và đang ở chi tiết một tài liệu PDF/TXT của mình, **When** bấm “Tóm tắt bằng AI”, **Then** app gửi tệp cho model `gemini-3.5-flash` và lưu bản tóm tắt tiếng Việt vào `document_summaries`. **Given** mất mạng hoặc Gemini lỗi, **When** gọi, **Then** báo lỗi tiếng Việt rõ ràng, cho thử lại, không tạo bản tóm tắt nửa vời. |
| FR-15 | Trích xuất nội dung PDF không cần thư viện ngoài | **Given** tài liệu PDF hợp lệ (≤ 10 MB theo luật CN2), **When** tóm tắt, **Then** PDF được gửi nguyên file (base64 inline) cho Gemini đọc bằng native vision, không cài thêm lib trích xuất PDF nào. FR-15 thỏa mà không cần lib. |
| FR-16 | DOCX không gọi AI | **Given** tài liệu DOCX (`extraction_status = 'unsupported'` từ CN2), **When** mở chi tiết, **Then** nút tóm tắt bị ẩn/vô hiệu hóa, UI gợi ý chuyển sang PDF, không có request nào gửi đi. |
| FR-17 | Mỗi tài liệu tối đa một bản tóm tắt đang dùng | **Given** tài liệu đã có bản tóm tắt, **When** bấm tóm tắt lại, **Then** bản cũ bị ghi đè (UPDATE cùng row, `UNIQUE(document_id)`), không tạo row thứ hai. Xóa tài liệu thì bản tóm tắt mất theo (`ON DELETE CASCADE`). |
| FR-18 | Hiển thị bản tóm tắt ở màn chi tiết | **Given** đang ở chi tiết tài liệu của mình, **When** xem vùng tóm tắt, **Then** thấy đúng một trong bốn trạng thái: đang tóm tắt (spinner), bản tóm tắt mới nhất, empty (“Chưa có bản tóm tắt — bấm nút để tạo”), lỗi kèm “Thử lại”. |
| FR-19 | Chặn gọi lặp và báo khi chạm hạn mức miễn phí | **Given** đang có request tóm tắt chạy (`processing`), **When** bấm nút lần nữa, **Then** bị chặn (nút disabled), không gửi request thứ hai. **Given** Gemini trả lỗi quota/429, **When** gọi, **Then** UI báo “Đã chạm giới hạn miễn phí hôm nay (khoảng 1.500 lượt/ngày, reset lúc nửa đêm giờ Thái Bình Dương), thử lại sau”, không tự retry. |
| FR-20 | Thử lại khi thất bại, thu hồi trạng thái treo | **Given** lần tóm tắt trước `failed`, **When** bấm “Thử lại”, **Then** chạy lại từ `processing`. **Given** app bị kill giữa chừng để lại `processing` quá 15 phút (so `updated_at`), **When** mở lại chi tiết, **Then** app tự đưa về `failed` và cho thử lại, không kẹt vĩnh viễn. |
| FR-21 | Bảo mật API key theo kết quả probe Edge Function | **Given** probe `cn3-g1` deploy được Edge Function proxy, **When** gọi AI, **Then** key nằm trong secret Supabase, app chỉ gửi JWT. **Given** probe thất bại, **When** gọi AI, **Then** dùng `EXPO_PUBLIC_GEMINI_API_KEY` và REPORT-NOTES ghi rõ đây là giới hạn đã biết của bản demo. Chỉ một nhánh được code, không làm cả hai. |
| FR-22 | Bản tóm tắt cách ly theo tài khoản | **Given** hai tài khoản A/B mỗi người một bản tóm tắt, **When** A select/insert/update/delete qua Supabase client, **Then** A chỉ thao tác row có `user_id = auth.uid()`; truy cập row B bị RLS chặn (kiểm chứng A/B như FR-05). |

### Luật validate và hành vi CN3

- Đầu vào tóm tắt: chỉ tài liệu PDF/TXT của chính user (`extraction_status`
  khác `unsupported`); DOCX không bao giờ tới được hàm gọi Gemini (chặn ở UI
  lẫn guard trong `requestSummary`).
- Ngưỡng dung lượng gửi Gemini (tra tài liệu Google ngày 2026-09-19):
  inline data tối đa 100 MB/request, **riêng PDF 50 MB**. Mọi tệp qua app đều
  ≤ 10 MB (luật CN2) nên luôn dưới ngưỡng → gửi nguyên file inline, không chia
  nhỏ. Tệp vượt ngưỡng (chỉ xảy ra nếu luật CN2 đổi hoặc gọi trực tiếp) thì từ
  chối trước khi gọi, báo rõ, không tự chunk — chunking ngoài đề.
- TXT gửi text trực tiếp (đọc bằng `expo-file-system` API mới như CN2), không
  base64.
- Chống đốt quota: không tóm tắt tự động sau upload; không retry tự động
  (kể cả lỗi mạng transient — user bấm “Thử lại”); mỗi lần bấm = tối đa một
  request; lỗi 429/quota không retry, chỉ báo.
- Bản tóm tắt lưu ở `document_summaries.summary_text`, tối đa 20.000 ký tự
  (CHECK ở DB; model hiếm khi trả dài hơn cho tóm tắt, vượt thì báo lỗi rõ
  thay vì cắt im lặng).
- Timeout thu hồi `processing` treo: 15 phút so trên `updated_at` (có sẵn nhờ
  trigger `set_updated_at()`), hằng số ở app, không phải job DB.

### Quy tắc dữ liệu CN3

- `document_summaries`: `id`, `document_id` (UNIQUE, FK về `documents(id)`
  `ON DELETE CASCADE`), `user_id` (denormalized từ `documents.user_id` để RLS
  viết trực tiếp `auth.uid() = user_id`, FK về `auth.users(id)` CASCADE),
  `summary_text` (1–20.000 ký tự), `model` (app CN3-G1 luôn ghi tường minh
  `gemini-3.5-flash`; default `gemini-2.5-flash` trong migration 0004 giữ
  nguyên vì migration đã apply — xem DEVLOG cn3-g1),
  timestamp. Chi tiết xem `docs/DATA-MODEL.md`; DDL thật ở
  `supabase/migrations/0004_cn3_summaries.sql`.
- Máy trạng thái `documents.extraction_status` trong CN3: `pending` →
  `processing` → `done`/`failed`; DOCX đi thẳng `unsupported` từ lúc upload
  (CN2) và CN3 không chạm. App đặt `pending → processing` ngay trước khi gọi
  Gemini; `processing → done` khi lưu xong summary; `processing → failed` khi
  lỗi. `unsupported` là trạng thái cuối, không retry.
- Xóa tài liệu (FR-11) kéo theo xóa bản tóm tắt qua CASCADE; không cần bước
  xóa riêng.

### OUT OF SCOPE của CN3 (đề không yêu cầu)

Tóm tắt hàng loạt nhiều tài liệu, streaming từng đoạn, chọn độ dài/phong cách
tóm tắt, lịch sử nhiều bản tóm tắt, xuất file/share bản tóm tắt, đánh giá chất
lượng tóm tắt, cache tóm tắt chung giữa các user, cron dọn `processing` treo
phía server, File API upload (không cần vì mọi tệp ≤ 10 MB < ngưỡng 50 MB),
hỏi đáp trên tài liệu (việc của CN4), model khác ngoài `gemini-3.5-flash`.

### Quyết định CN3 đã chốt (mỗi cái kèm lý do)

- CN3-MODEL: Model `gemini-3.5-flash` (từ CN3-G1; trước đó đặc tả ghi
  `gemini-2.5-flash` nhưng model này có lịch shutdown sớm nhất 16/10/2026
  nên chốt 3.5-flash ngay từ đầu, khỏi migrate giữa chừng); free tier khoảng
  1.500 request/ngày
  (reset nửa đêm giờ Thái Bình Dương) nên phải có cơ chế chặn gọi lặp và thông
  báo hạn mức (FR-19). Lý do: demo dùng chung một project/quota; không chặn
  thì một buổi bấm thử vô tội vạ là hết quota cả lớp, không còn gì để demo.
- CN3-NOLIB: Gemini đọc PDF bằng native vision, KHÔNG dùng lib trích xuất PDF
  (không có bản nào chạy được trên Expo Go), FR-15 thỏa mà không cần lib.
  Lý do: mọi lib PDF trên React Native đều cần native module → development
  build, trái quyết định “chạy bằng Expo Go”; gửi PDF inline cho model vừa đủ
  vừa giữ nguyên stack.
- CN3-KEY: đường đi của key theo kết quả probe `cn3-g1` (tag `edge-probe`
  được lệnh nhắc tới nhưng không tồn tại nên probe làm lại từ đầu trong
  CN3-01). Deploy được thì Edge Function proxy giữ key trong secret Supabase,
  app gửi JWT. Không được thì `EXPO_PUBLIC_GEMINI_API_KEY` và ghi rõ là giới
  hạn đã biết của bản demo trong REPORT-NOTES. Lý do: key trong app đọc được
  bằng giải nén bundle — chấp nhận được cho demo nhưng phải ghi thẳng, không
  giả vờ an toàn; proxy là đường đúng cho bản thật.
- CN3-SIZE: ngưỡng inline 100 MB/request, PDF 50 MB; tệp vượt ngưỡng thì từ
  chối trước khi gọi, không chunk. Lý do: số liệu tra trực tiếp từ tài liệu
  Google hiện hành; app chặn 10 MB nên nhánh vượt ngưỡng praktisch không bao
  giờ xảy ra — code đơn giản, không ôm việc chia nhỏ ngoài đề.
- CN3-STATUS: máy trạng thái `pending → processing → done/failed`, DOCX
  thẳng `unsupported`; app đặt trạng thái; retry chỉ khi `failed` và do user
  bấm; `processing` quá 15 phút coi như treo và tự thu hồi về `failed`.
  Lý do: không có backend/cron nên client phải tự dọn; dùng `updated_at` có
  sẵn thay vì thêm cột; không auto-retry để khỏi đốt quota free.
- CN3-TRIGGER: kích hoạt tóm tắt bằng nút người dùng bấm, KHÔNG tự động sau
  upload. Lý do: mỗi lần tóm tắt tốn 1 request quota; auto sẽ đốt quota cho
  file user chưa cần đọc và làm demo khó kiểm soát; nút bấm cũng là chốt chặn
  gọi lặp tự nhiên nhất.
- CN3-SCHEMA: lưu bản tóm tắt ở bảng riêng `document_summaries`, không thêm
  cột vào `documents`. Lý do: tách vòng đời (ghi đè 1 row, sau này muốn lịch
  sử cũng không vỡ schema), không phình `documents`, RLS độc lập rõ ràng,
  CASCADE dọn kèm khi xóa tài liệu.
- CN3-PDF-EXTRACT (bổ sung theo code, không migration mới): tóm tắt PDF là
  MỘT lần gọi Gemini trả JSON đúng 2 trường `extracted_text` (toàn văn) và
  `summary_text` (tóm tắt) qua `responseMimeType: 'application/json'` +
  `responseSchema`; app ghi CẢ HAI trong cùng một update `documents`
  (`extracted_text` + `done`) kèm upsert `document_summaries`. Không chunking,
  không vector DB (PDF ≤ 10 MB < ngưỡng 50 MB/1000 trang). Cắt cụt có hai
  nhánh: (a) còn chuỗi dở cứu được → lưu phần dở với `done` tái dùng rồi báo
  user biết bị cắt (cấm giả vờ thành công); (b) rỗng hoàn toàn
  (parts/text null khi chạm MAX_TOKENS) → `failed`, không ghi đè summary cũ
  bằng rỗng. CHECK `extraction_status` chỉ có
  `pending/processing/done/failed/unsupported` nên không bịa giá trị mới cho
  "cắt cụt". Không đặt `max_output_tokens` nhỏ; giữ nguyên xử lý 429/5xx.

### CN4 — AI hỏi đáp dựa trên tài liệu (FR-23 → FR-30, bổ sung theo code đã có)

| FR | Yêu cầu | Acceptance criteria (Given / When / Then) |
|----|---------|-------------------------------------------|
| FR-23 | Hỏi trên tài liệu của mình | **Given** đã đăng nhập và đang ở chi tiết tài liệu có `extracted_text`, **When** nhập câu hỏi (1–500 ký tự) và bấm “Hỏi”, **Then** app gọi Gemini đúng một lần rồi insert một row `document_questions`; ô nhập có testID `qa-input`/`qa-submit`, key lịch sử `['questions', documentId]`. Lỗi không tạo row. |
| FR-24 | Nhồi toàn văn vào prompt, cấm RAG | **Given** tài liệu có `extracted_text`, **When** hỏi, **Then** toàn văn được nhồi thẳng vào prompt một request kèm header bắt model chỉ trả lời theo tài liệu, không bịa; không vector DB/RAG/chunking. TXT giữ nguyên hành vi; PDF sau trích toàn văn hỏi đáp y như TXT. |
| FR-25 | DOCX không gọi AI | **Given** tài liệu DOCX/`unsupported`, **When** mở chi tiết, **Then** guard ném `ChatGuardError`, không gọi Gemini; UI không hiện ô nhập khi thiếu text. |
| FR-26 | Lịch sử hỏi đáp append-only | **Given** đã hỏi trên một tài liệu, **When** xem lịch sử, **Then** thấy mới nhất trước (`order created_at desc`); lượt hỏi lỗi không tạo row; không sửa/xóa từng câu. |
| FR-27 | Bốn trạng thái vùng hỏi đáp | **Given** đang ở vùng hỏi đáp, **When** xem, **Then** thấy đúng một trong: skeleton / empty (chưa có text thì dẫn tóm tắt trước) / nội dung / lỗi + “Thử lại”; lỗi field nằm dưới ô nhập, giữ câu hỏi khi lỗi mạng. |
| FR-28 | Báo hạn mức và lỗi server | **Given** Gemini trả 429/quota, **When** hỏi, **Then** banner hạn mức, không retry. **Given** 5xx/mạng, **When** hỏi, **Then** câu riêng + “Thử lại” giữ nguyên câu hỏi. |
| FR-29 | Lịch sử cách ly theo tài khoản | **Given** hai tài khoản A/B mỗi người lịch sử riêng, **When** A select/insert qua client, **Then** A chỉ thao tác row có `user_id = auth.uid()`; chéo bị RLS chặn như FR-05/FR-22. |
| FR-30 | Migration và verify CN4 | **Given** migration `0005_cn4_questions.sql` (idempotent, RLS 4 lệnh, CASCADE, CHECK câu 1–500/đáp 1–20000/model 1–100), **When** dán tay qua SQL Editor rồi chạy `scripts/cn4-schema-verify.mjs`, **Then** `VERIFY_PASS`; types tay trong `database.ts` khớp. Cấm `db push`. |

### Luật validate và hành vi CN4 (theo code)

- Guard trước mạng: sai chủ → từ chối; DOCX/`unsupported` → chặn; thiếu
  `extracted_text` (rỗng sau trim) → chặn, bảo tóm tắt trước; câu hỏi validate
  trước khi gọi (rỗng/quá 500 bị từ chối).
- Câu trả lời validate 1–20000 trước khi insert; vượt thì báo, không cắt,
  không tạo row.
- Không retry tự động; mỗi lần hỏi tối đa một request Gemini.

### OUT OF SCOPE của CN4 (theo code, không làm)

- Sửa/xóa từng câu hỏi, stream câu trả lời, gợi ý câu hỏi, đánh giá chất
  lượng đáp, RAG/chunking/vector DB, cache đáp chung giữa các user.

### CN5 — Quét hình ảnh đề bài bằng AI (FR-31 → FR-37, session docs đề xuất)

> Lưu ý nguồn: đề gốc trong repo chỉ liệt kê tên Chức năng 5 (“Quét hình ảnh
> đề bài bằng AI”, FR-31 → FR-37) mà không kèm nội dung từng FR. Bảng dưới là
> diễn giải do session `docs/cn5-spec` đề xuất từ lệnh chi tiết của chủ dự án
> (image-picker phủ FR-31+FR-32, luồng quyền camera, Gemini multimodal OCR,
> cắt cụt hai nhánh) và hạ tầng CN2/CN3 (`documents` + `extracted_text` +
> `extraction_status`, transport duy nhất ở `src/lib/ai`). Nếu đề gốc khác,
> sửa bảng này trước, không sửa code theo bảng cũ.

| FR | Yêu cầu | Acceptance criteria (Given / When / Then) |
|----|---------|-------------------------------------------|
| FR-31 | Chọn ảnh đề bài từ thư viện | **Given** đã đăng nhập và đang ở màn quét, **When** chọn một ảnh (đúng định dạng, còn hiệu lực), **Then** ảnh được nạp để OCR, UI hiện xem trước. **Given** ảnh sai định dạng (GIF) hoặc user bấm hủy, **When** chọn, **Then** bị từ chối kèm thông báo tiếng Việt (GIF) hoặc quay lại im lặng (hủy), không tạo request nào. |
| FR-32 | Chụp ảnh đề bài bằng camera | **Given** đã đăng nhập và đã cấp quyền camera, **When** bấm chụp và xác nhận ảnh, **Then** ảnh được nạp để OCR như FR-31. **Given** chưa cấp quyền, **When** bấm chụp, **Then** app xin quyền trước; từ chối vĩnh viễn (`canAskAgain === false`) thì hiện hướng dẫn mở Settings, không để nút bấm chết. Trên Android, ảnh mất do hệ thống kill picker được cứu bằng `getPendingResultAsync()`. |
| FR-33 | OCR ảnh bằng Gemini multimodal (không ML Kit) | **Given** đã có ảnh hợp lệ, **When** bấm “Quét”, **Then** app gửi đúng một request cho model trong `src/lib/ai/models.ts` (prompt text TRƯỚC ảnh, JSON qua `responseMimeType` + `responseSchema`) và nhận chuỗi OCR tiếng Việt. **Given** mất mạng hoặc Gemini lỗi 429/5xx, **When** gọi, **Then** báo lỗi tiếng Việt rõ ràng, cho thử lại, giữ nguyên mapping 429/5xx của CN3, không retry tự động. |
| FR-34 | Lưu kết quả quét vào bảng `documents` | **Given** OCR thành công, **When** ghi, **Then** một row `documents` mới được tạo (ảnh lên bucket, `extracted_text` = toàn văn OCR, `extraction_status = 'done'`). Cắt cụt có hai nhánh như CN3-PDF: (a) còn chuỗi dở cứu được → lưu phần dở với `done` tái dùng rồi báo user biết bị cắt (cấm giả vờ thành công); (b) rỗng hoàn toàn → `failed`, không ghi đè dữ liệu cũ bằng rỗng. |
| FR-35 | Hiển thị kết quả quét ở màn quét | **Given** đang ở màn quét, **When** xem, **Then** thấy đúng một trong: đang quét (spinner + nút disabled), văn bản OCR mới nhất, empty (“Chưa có kết quả — chọn/chụp ảnh để quét”), lỗi kèm “Thử lại”. Ảnh mờ/không có chữ/không phải đề bài → thông báo tiếng Việt rõ ràng, không để màn hình đứng im. |
| FR-36 | Chặn gọi lặp và báo khi chạm hạn mức miễn phí | **Given** đang có request quét chạy (`processing`), **When** bấm nút lần nữa, **Then** bị chặn (nút disabled), không gửi request thứ hai. **Given** Gemini trả lỗi quota/429, **When** gọi, **Then** UI báo hạn mức như CN3, không tự retry. |
| FR-37 | Kết quả quét cách ly theo tài khoản | **Given** hai tài khoản A/B mỗi người lịch sử quét riêng, **When** A select/insert/update/delete qua Supabase client, **Then** A chỉ thao tác row có `user_id = auth.uid()`; truy cập row B bị RLS chặn (kế thừa 4 policy `documents` đã có, kiểm chứng A/B như FR-05). |

### Luật validate và hành vi CN5

- Chọn/chụp bằng `expo-image-picker` (đã cài `~57.0.19`, KHÔNG thêm
  `expo-camera`, KHÔNG config plugin trong `app.json` vì dự án không
  prebuild): `mediaTypes: ['images']` (mảng chuỗi; CẤM `MediaTypeOptions`
  deprecated); đọc `result.canceled` và `result.assets[0]` (CẤM
  `result.cancelled` 2 chữ L, CẤM `result.uri`); `base64: true`.
- `asset.base64` LUÔN là dữ liệu JPEG theo doc Expo nên gửi Gemini với mime
  `image/jpeg` — CẤM đoán mime từ đuôi tên file (iOS SDK 54+ mặc định
  `allowsEditing: false` nên `fileName` có thể là `.HEIC` trong khi ruột là
  JPEG).
- Lọc định dạng Gemini không đọc: chỉ nhận png/jpeg/webp/heic/heif; GIF bị
  từ chối kèm thông báo tiếng Việt (Android cho chọn GIF). Dừng ở lỗi đầu
  tiên với một thông báo rõ ràng, không tạo object hay bản ghi nào.
- Đọc ảnh gửi Gemini: base64 → ArrayBuffer (`base64-arraybuffer`) +
  contentType; CẤM `fetch(uri).blob()` (trả file 0 byte). Chỉ API mới
  (`File`, `Directory`, `Paths`); CẤM `expo-file-system/legacy`.
- Quyền camera: `requestCameraPermissionsAsync()` trước
  `launchCameraAsync()`; `canAskAgain === false` → hướng dẫn mở Settings,
  CẤM để nút bấm không có gì xảy ra; Android gọi `getPendingResultAsync()`
  để cứu ảnh khi hệ thống kill MainActivity lúc picker đang mở.
- User bấm hủy picker → quay lại trạng thái cũ, không báo lỗi, không request.
- OCR: prompt text TRƯỚC ảnh trong mảng input (doc Gemini yêu cầu); núm duy
  nhất được phép xoay khi chữ nhỏ/mờ đọc sai là `media_resolution` (và
  `thinking_level` nếu cần); CẤM temperature/top_p/top_k/candidate_count/
  thinking_budget (Gemini 3.x trả HTTP 400).
- Cắt cụt hai nhánh (với `responseSchema` bật, chạm MAX_TOKENS thường trả
  parts/text null, không có mẩu JSON để cứu): (a) còn chuỗi dở → cứu phần
  lấy được + BÁO user biết bị cắt; (b) rỗng hoàn toàn → báo thất bại rõ,
  KHÔNG ghi đè dữ liệu cũ bằng rỗng, CẤM giả vờ thành công.
- Không retry tự động (kể cả lỗi mạng transient — user bấm “Thử lại”); mỗi
  lần bấm tối đa một request; lỗi 429/quota không retry, chỉ báo.
- Mỗi lần quét một ảnh duy nhất; không quét hàng loạt, không stream, không
  chỉnh sửa/cắt ảnh trong app (`allowsEditing` giữ mặc định false).

### Quy tắc dữ liệu CN5

- Mỗi lần quét = một row `documents` mới (không ghi đè, khác CN3): `user_id`
  của chủ, `display_name` tái dùng luật CN2 (chuẩn hóa trim/gộp khoảng trắng,
  1–120 ký tự; mặc định gợi ý theo thời gian quét khi user không đặt tên),
  `storage_path` `{user_id}/{uuid}.{ext}` (UUID bằng `Crypto.randomUUID()`
  của `expo-crypto`), `extracted_text` = toàn văn OCR, `extraction_status`
  tái dùng máy `pending → processing → done/failed` (thu hồi treo 15 phút
  theo `updated_at` như CN3; không có giá trị mới).
- Ảnh gốc lên bucket `documents` (private, tái dùng 4 Storage policy theo
  `{user_id}/` đã có); DB chỉ lưu path, xem bằng signed URL TTL 3600s.
- RLS: tái dùng 4 policy `documents` (`auth.uid() = user_id`); không bảng
  mới nên không policy mới. Đổi tên/xóa row quét tái dùng FR-10/FR-11
  (đổi nhãn DB, xóa storage-trước-DB-sau).
- Migration `0006_cn5_scan_images.sql` (session code soạn, DÁN TAY qua SQL
  Editor, CẤM `db push`): MỞ RỘNG whitelist `file_ext` và
  `allowed_mime_types` của bucket cho ảnh (png/jpg/jpeg/webp/heic/heif;
  KHÔNG gif vì Gemini không đọc — gif chặn ở client), trần kích thước ảnh
  10 MB như tài liệu. Không bảng mới, không cột mới, không giá trị
  `extraction_status` mới. Kèm `scripts/cn5-schema-verify.mjs` (khuôn
  cn3/cn4); soạn xong DỪNG chờ apply rồi verify `VERIFY_PASS` mới code tiếp.

### OUT OF SCOPE của CN5 (đề không yêu cầu)

ML Kit/thư viện OCR native, development build, prebuild, `expo-camera`,
migrate sang Interactions API, đổi model sang 3.6/3.7/3.8-flash, Edge
Function proxy (đã bỏ hẳn), quét hàng loạt nhiều ảnh, streaming OCR, chỉnh
sửa/cắt ảnh trong app, lịch sử nhiều bản OCR cho một lần quét, xuất
file/share kết quả, đánh giá chất lượng OCR, cache OCR chung giữa các user,
cron dọn `processing` treo phía server, gợi ý lời giải (việc của CN6).

### Quyết định CN5 đã chốt (mỗi cái kèm lý do)

- CN5-MODEL: dùng lại model trong `src/lib/ai/models.ts` (không hardcode nơi
  khác, không thêm model mới nếu cùng `gemini-3.5-flash`). Lý do: bẫy bất
  biến — model là hằng số duy nhất, hardcode rời là drift.
- CN5-TRANSPORT: dùng lại transport ở `src/lib/ai` (mở rộng `postGenerate`
  dùng chung như CN4 đã làm), CẤM đường gọi Gemini thứ hai. Lý do: một đường
  gọi duy nhất giữ mapping lỗi 429/5xx nhất quán, không phân mảnh.
- CN5-SCHEMA: không bảng/cột mới, chỉ mở rộng whitelist ảnh qua 0006. Lý do:
  `documents` + `extracted_text` + `extraction_status` đã đủ vòng đời quét;
  bảng riêng là phình schema ngoài đề.
- CN5-STORAGE: ảnh quét vào chung bucket `documents` (mở rộng MIME), không
  bucket mới. Lý do: 4 Storage policy theo `{user_id}/` tái dùng nguyên vẹn,
  bucket mới đồng nghĩa policy mới ngoài đề.
- CN5-TRIGGER: kích hoạt quét bằng nút user bấm, KHÔNG tự động sau chọn/chụp.
  Lý do: mỗi lần quét tốn 1 request quota (~1.500/ngày); auto đốt quota cho
  ảnh user chưa cần đọc.
- CN5-SINGLE: mỗi lần quét đúng một ảnh. Lý do: đề là quét đề bài đơn lẻ;
  nhiều ảnh là quét hàng loạt ngoài đề.

### CN6 — AI gợi ý lời giải (FR-38 → FR-45, session docs đề xuất)

> Lưu ý nguồn: đề gốc trong repo chỉ liệt kê tên Chức năng 6 (“AI gợi ý
> lời giải”, FR-38 → FR-45) mà không kèm nội dung từng FR. Bảng dưới là
> diễn giải do session `docs/cn6-spec` đề xuất từ lệnh chi tiết của chủ dự
> án (đầu vào là `extracted_text` sẵn có của CN3/CN5 nhồi thẳng, tái dùng
> transport `src/lib/ai`, cắt cụt hai nhánh, giữ xử lý 429/5xx của CN3) và
> hạ tầng hiện có (`documents` + `extracted_text`, 3 đường gọi Gemini đã
> có: tóm tắt/hỏi đáp/OCR). Nếu đề gốc khác, sửa bảng này trước, không sửa
> code theo bảng cũ.

| FR | Yêu cầu | Acceptance criteria (Given / When / Then) |
|----|---------|-------------------------------------------|
| FR-38 | Gợi ý lời giải cho tài liệu của mình đã có `extracted_text` | **Given** đã đăng nhập và đang ở chi tiết một tài liệu của mình có `extracted_text` (PDF/TXT đã tóm tắt ở CN3 hoặc ảnh đã quét ở CN5 — cả hai đều là row `documents`), **When** bấm “Gợi ý lời giải”, **Then** app gửi toàn văn cho model trong `src/lib/ai/models.ts` đúng một lần và lưu gợi ý tiếng Việt. **Given** mất mạng hoặc Gemini lỗi, **When** gọi, **Then** báo lỗi tiếng Việt rõ ràng, cho thử lại, không tạo gợi ý nửa vời. |
| FR-39 | Thiếu `extracted_text` / DOCX không gọi AI | **Given** tài liệu DOCX (`extraction_status = 'unsupported'`) hoặc chưa có `extracted_text` (rỗng sau trim), **When** mở chi tiết, **Then** nút gợi ý bị ẩn/vô hiệu hóa, UI dẫn đi tóm tắt (CN3) hoặc quét (CN5) trước, không có request nào gửi đi. |
| FR-40 | Gọi Gemini qua transport dùng lại, cấm đường gọi thứ hai | **Given** đã có `extracted_text` hợp lệ, **When** gọi, **Then** app dùng đúng transport ở `src/lib/ai` (hàm mới `solveWithGemini` mở rộng `postGenerate` dùng chung như CN4/CN5 đã làm: prompt giải bài + `responseMimeType` + `responseSchema` JSON) và nhận gợi ý tiếng Việt. **Given** Gemini trả 429/5xx/mất mạng, **When** gọi, **Then** giữ nguyên mapping 429/5xx của CN3, không retry tự động. CẤM temperature/top_p/top_k/candidate_count/thinking_budget (Gemini 3.x trả HTTP 400); model đọc từ `models.ts`, cấm hardcode. |
| FR-41 | Lưu gợi ý vào bảng `document_solutions` (ghi đè 1-1) | **Given** gọi thành công, **When** ghi, **Then** một row `document_solutions` được upsert theo `UNIQUE(document_id)` (gợi ý lại = ghi đè, không tạo row thứ hai; xóa tài liệu kéo theo mất gợi ý qua `CASCADE`). Cắt cụt hai nhánh như CN3-PDF/CN5: (a) còn chuỗi dở cứu được → lưu phần dở rồi báo user biết bị cắt (cấm giả vờ thành công); (b) rỗng hoàn toàn (parts/text null khi chạm MAX_TOKENS) → báo thất bại rõ, KHÔNG ghi đè gợi ý cũ bằng rỗng. |
| FR-42 | Hiển thị vùng gợi ý lời giải ở màn chi tiết | **Given** đang ở chi tiết tài liệu của mình, **When** xem vùng gợi ý lời giải, **Then** thấy đúng một trong bốn trạng thái: đang gợi ý (spinner + nút disabled), gợi ý mới nhất, empty (“Chưa có gợi ý — bấm nút để tạo”), lỗi kèm “Thử lại”. |
| FR-43 | Chặn gọi lặp và báo khi chạm hạn mức miễn phí | **Given** đang có request gợi ý chạy (mutation pending), **When** bấm nút lần nữa, **Then** bị chặn (nút disabled + guard), không gửi request thứ hai. **Given** Gemini trả lỗi quota/429, **When** gọi, **Then** UI báo hạn mức như CN3, không tự retry. Không có trạng thái treo cần thu hồi (khác CN3/CN5): trạng thái suy từ row `document_solutions` + mutation client, không lật cột `extraction_status` của `documents` (đang `done`, lật là phá ngữ nghĩa CN3/CN5). |
| FR-44 | Gợi ý lời giải cách ly theo tài khoản | **Given** hai tài khoản A/B mỗi người gợi ý riêng, **When** A select/insert/update/delete qua Supabase client, **Then** A chỉ thao tác row có `user_id = auth.uid()`; truy cập row B bị RLS chặn (bảng mới `document_solutions` mang RLS 4 lệnh khuôn CN3/CN4, kiểm chứng A/B như FR-05). |
| FR-45 | Migration và verify CN6 | **Given** migration `0007_cn6_solutions.sql` (idempotent, bảng `document_solutions` + RLS 4 lệnh + CASCADE + CHECK + trigger tái dùng, KHÔNG đụng cột/bảng cũ), **When** dán tay qua SQL Editor rồi chạy `scripts/cn6-schema-verify.mjs`, **Then** `VERIFY_PASS`; types tay trong `database.ts` khớp. CẤM `db push` (PAT sbp_ bị RBAC chặn ghi như CN5-01). |

### Luật validate và hành vi CN6

- Đầu vào gợi ý: chỉ tài liệu của chính user có `extracted_text` non-empty
  (sau trim); DOCX/`unsupported`/thiếu text chặn ở UI lẫn guard trong
  `requestSolution`, KHÔNG bao giờ tới được hàm gọi Gemini (FR-39).
- Nhồi thẳng toàn văn `extracted_text` vào prompt trong MỘT request duy
  nhất; CẤM vector DB/RAG/chunking (đề bài ≤ 10 MB nguồn nên prompt luôn
  gọn; vượt ngưỡng thì từ chối rõ, không tự chia nhỏ).
- `solveWithGemini(source: { contextText: string })` sống trong
  `src/lib/ai/transport.ts`, gọi qua `postGenerate` dùng chung (giữ mapping
  429/quota/5xx/mạng của CN3, `emptyMessage` riêng ngữ cảnh gợi ý). Prompt
  cố định: đọc đề bài, gợi ý lời giải/hướng giải từng bước bằng tiếng
  Việt, chỉ dựa trên đề bài, không bịa dữ kiện; `responseMimeType` +
  `responseSchema` JSON một trường `solution_text` (khuôn OCR CN5).
- Parser JSON 3 nhánh tái dùng mẫu CN5 (`parseOcrJson`): đủ → lưu;
  dở → cứu chuỗi dở + `truncated: true` (lưu phần cứu được rồi báo cắt);
  rỗng hoàn toàn → ném `GeminiEmptyError` (không upsert rỗng, giữ gợi ý cũ).
- Gợi ý lưu ở `document_solutions.solution_text`, tối đa 20.000 ký tự
  (CHECK ở DB mirror `document_summaries`/`document_questions`; vượt thì
  báo lỗi rõ thay vì cắt im lặng).
- Vòng đời 1-1 ghi đè như CN3 (không append-only như CN4): gợi ý lại =
  UPDATE cùng row theo `UNIQUE(document_id)`; không sửa/xóa từng bản.
- Chống đốt quota: không gợi ý tự động sau tóm tắt/quét; không retry tự
  động (kể cả lỗi mạng transient — user bấm “Thử lại”); mỗi lần bấm = tối
  đa một request; lỗi 429/quota không retry, chỉ báo.
- Không đặt `max_output_tokens` nhỏ; không temperature/top_p/top_k/
  candidate_count/thinking_budget; núm duy nhất được phép là
  `thinking_level`/`media_resolution` nếu cần (khuôn CN5).

### Quy tắc dữ liệu CN6

- Bảng mới `document_solutions` (session schema soạn `0007`, DÁN TAY qua
  SQL Editor, CẤM `db push`; soạn xong DỪNG chờ apply rồi verify
  `VERIFY_PASS` mới code tiếp — khuôn CN5-01): `id` (uuid pk), `document_id`
  (uuid not null UNIQUE, FK về `documents(id) ON DELETE CASCADE`),
  `user_id` (uuid not null, denormalized để RLS viết trực tiếp
  `auth.uid() = user_id`, FK về `auth.users(id) CASCADE`), `solution_text`
  (1–20.000 ký tự, mirror `document_summaries_summary_rules`),
  `model` (1–100 ký tự, default `'gemini-3.5-flash'` như CN4),
  `created_at`/`updated_at` (trigger `set_updated_at()` tái dùng, không
  function mới); index `(user_id)`; RLS 4 lệnh khuôn CN3/CN4; grants
  `authenticated` CRUD, `service_role` full, `revoke anon`.
- Vì sao bảng mới thay vì tái dùng (đã soi cả 3 đường gọi + schema):
  `document_summaries` là bản tóm tắt 1-1 (ghi đè là mất tóm tắt);
  `document_questions` là lịch sử hỏi đáp append-only (nhét gợi ý vào là
  trộn lịch sử); `documents` không còn cột trạng thái trống (lật
  `extraction_status` đang `done` là phá ngữ nghĩa CN3/CN5, và CHECK chỉ có
  đúng 5 giá trị `pending/processing/done/failed/unsupported` — đọc nguyên
  văn `0002`, CẤM bịa giá trị mới). Bảng riêng là phình tối thiểu có lý do,
  mirror CN3-SCHEMA.
- Xóa tài liệu (FR-11) kéo theo xóa gợi ý qua CASCADE; không bước xóa riêng.
- UI là một vùng trong `/documents/[id]` (không route mới — row quét CN5
  cũng là row `documents` nên một vùng phục vụ cả hai nguồn); thẻ CN6 trên
  dashboard trỏ về tab Tài liệu như CN3/CN4 sau khi code xong (docs session
  chưa lật `featureStatus`, giữ `'soon'`).

### OUT OF SCOPE của CN6 (đề không yêu cầu)

Chấm điểm bài làm, chữa bài tự luận chi tiết từng dòng, gợi ý hàng loạt
nhiều tài liệu, streaming từng đoạn, chọn độ dài/phong cách gợi ý, lịch sử
nhiều bản gợi ý, xuất file/share gợi ý, đánh giá chất lượng gợi ý, cache
gợi ý chung giữa các user, cron dọn trạng thái treo phía server, RAG/
chunking/vector DB, File API upload, model khác ngoài hằng số ở
`models.ts`, Edge Function proxy (đã bỏ hẳn từ CN5), migrate sang
Interactions API.

### Quyết định CN6 đã chốt (mỗi cái kèm lý do)

- CN6-INPUT: đầu vào là `extracted_text` sẵn có (CN3 cho PDF, CN5 cho ảnh),
  nhồi thẳng một request. Lý do: đề bài đã nằm gọn trong DB sau CN3/CN5;
  RAG/chunking là ôm việc ngoài đề cho input ≤ 10 MB nguồn.
- CN6-TRANSPORT: mở rộng `postGenerate` dùng chung bằng `solveWithGemini`,
  CẤM đường gọi Gemini thứ hai. Lý do: một đường gọi duy nhất giữ mapping
  lỗi 429/5xx nhất quán (đã có 3 chỗ gọi: tóm tắt/hỏi đáp/OCR — soi cả 3,
  không copy).
- CN6-MODEL: dùng lại hằng số duy nhất ở `src/lib/ai/models.ts`, cấm
  hardcode nơi khác. Lý do: bẫy bất biến như CN5-MODEL.
- CN6-SCHEMA: bảng mới `document_solutions` 1-1 ghi đè (mirror CN3-SCHEMA),
  không cột mới trên `documents`, không giá trị status mới. Lý do: hai bảng
  cũ chứa không vừa (tóm tắt/lịch sử hỏi đáp), CHECK cũ không có chỗ cho
  trạng thái gợi ý.
- CN6-STATUS: không máy trạng thái persistent cho gợi ý (khác CN3/CN5).
  Lý do: CN4 đã chứng minh hỏi đáp chạy tốt không cần status; trạng thái
  suy từ row + mutation client, không còn kẹt `processing` để phải thu hồi.
- CN6-TRIGGER: kích hoạt bằng nút user bấm, KHÔNG tự động sau tóm tắt/quét.
  Lý do: mỗi lần gợi ý tốn 1 request quota (~1.500/ngày); auto đốt quota
  cho đề user chưa cần giải.
- CN6-SINGLE: mỗi lần gợi ý cho đúng một tài liệu. Lý do: đề là gợi ý theo
  đề bài đơn lẻ; nhiều tài liệu là gợi ý hàng loạt ngoài đề.

## CẦN CHỦ DỰ ÁN QUYẾT ĐỊNH

Không còn câu hỏi mở. Chủ dự án đã chốt:

1. Chạy bằng **Expo Go**, không dùng development build.
2. FR-03 dùng OTP 6 số qua email: `resetPasswordForEmail` + `verifyOtp` với type `recovery`; không phụ thuộc deep link. Deep link chỉ là bonus nếu còn thời gian.
3. Tắt **Confirm email** khi dev; biến `EXPO_PUBLIC_REQUIRE_EMAIL_CONFIRMATION=false`. Khi demo, bật lại trên Supabase Dashboard và đổi cờ thành `true`.
4. `student_code` bắt buộc, duy nhất và phân biệt hoa/thường.
5. Avatar chỉ nhận JPEG/PNG/WEBP, tối đa 2 MB.
6. Mật khẩu tối thiểu 8 ký tự, có ít nhất một chữ và một số.
