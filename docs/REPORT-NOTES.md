# Nguyên liệu báo cáo và vấn đáp

Chỉ điền bằng bằng chứng từ code/test thực tế. Không tuyên bố FR “đạt” trước khi `FR-TRACEABILITY.md` và checklist đã cập nhật.

## Khung báo cáo

1. **Bài toán:** quản lý tài khoản sinh viên; năm FR; phạm vi 5 ngày.
2. **Phạm vi:** Auth, profile, avatar, một bảng `study_notes`; nêu rõ out of scope.
3. **Công nghệ:** Expo SDK 57/TypeScript strict; expo-router; Supabase; form/query/UI libraries; lý do từ `ARCHITECTURE.md`.
4. **Kiến trúc:** sơ đồ screen → feature API → Supabase; route guard; server state và auth state.
5. **Mô hình dữ liệu:** `profiles`, `study_notes`, trigger tạo profile/cập nhật timestamp; Storage private.
6. **Bảo mật:** JWT cung cấp `auth.uid()`; RLS cho từng lệnh; publishable key không thay thế policy; không có service-role key trong app.
7. **Luồng chính:** đăng ký, login/logout, reset password bằng OTP email, sửa profile/avatar, CRUD note.
8. **Kiểm thử:** bảng kết quả tốt/xấu; bằng chứng A/B cho RLS; lỗi offline/token/link hết hạn.
9. **Git:** một branch/giai đoạn, commit theo task, push sau mỗi commit; G1–G3
   PR review, từ G4 agent tự merge sau khi cổng xanh và tag mốc.
10. **Giới hạn và bài học:** chỉ ghi điều thực tế sau G5.

## Ảnh/bằng chứng cần chuẩn bị

- Mỗi màn hình ở trạng thái success và ít nhất một error/empty/loading tiêu biểu.
- Riêng `/profile` G5: form đã điền + avatar hiển thị; Snackbar lỗi mã trùng;
  avatar fallback chữ cái đầu khi chưa có ảnh; dialog/notice khi từ chối quyền ảnh.
- Dashboard cho thấy RLS enabled và bucket `avatars` private; che project ref/key/email.
- Kết quả truy cập chéo A/B cho SELECT/INSERT/UPDATE/DELETE (notes) và
  download/signed URL + anon (avatar).
- Output `npm test` (91/91), `npx tsc --noEmit`, `npm run lint` cuối; không chụp `.env`.
- `git log --oneline --decorate --graph --all` cho các mốc G1..G6 + tag `v1.1.0`.

## Ảnh before/after G6 (UI/UX polish + icon system)

Chủ dự án tự chụp trên cùng một máy thật (Expo Go), mỗi màn hình một cặp:

- `/sign-in`, `/sign-up`, `/forgot-password`, `/verify-reset-otp`,
  `/reset-password`: before (G5: không icon hoặc icon rỗng) → after (G6:
  icon dẫn đầu hiện đủ, nút submit có icon + spinner).
- `/profile`: before (nút “Đổi avatar” chữ, Snackbar thô) → after (chạm
  avatar với overlay camera, `FeedbackSnackbar` có leading icon theo variant).
- `/notes`: before (Card list, empty chữ) → after (`List.Item` icon +
  `Divider`, `EmptyState` icon lớn, `FAB`).
- Dark mode: bật tối hệ điều hành, chụp `/sign-in` + `/notes` (theme theo
  `useColorScheme`, `StatusBar` đổi theo).

Điểm cần thấy rõ trong ảnh after: icon không còn ô trống; dark mode nền
tối chữ sáng; bàn phím không che input (chụp lúc focus ô mật khẩu).

## Ảnh light/dark G7 (theme switcher)

Chủ dự án tự chụp trên cùng một máy thật (Expo Go), mỗi màn hình một cặp
light → dark (cùng nội dung để thấy tương phản):

- `/notes` (có data) + trạng thái empty + `/profile` (có avatar và Card
  “Giao diện” đang chọn).
- Nút theme trên Appbar ở cả 3 mode (icon `theme-light-dark` /
  `weather-sunny` / `weather-night`).
- Một màn form (`/sign-in`) ở light mode để chứng minh không có chữ trắng
  trên nền sáng.

Điểm cần thấy rõ: cùng một màn, light nền sáng chữ tối, dark nền tối chữ
sáng; không có chỗ nào hardcode màu còn sót (đặc biệt overlay camera trên
avatar và Snackbar).

## Ảnh v2.0.0 (theme indigo — chụp lại toàn bộ, ảnh theme tím cũ hết dùng được)

Từ CN2-13 app dùng bảng màu riêng seed `#4A5FC1` (primary light `#505B92`,
dark `#B9C3FF`); mọi ảnh chụp trước v2.0.0 (tím `#6750A4`) không còn khớp UI
thật. Chủ dự án chụp lại theo `docs/TEST-CHECKLIST.md` mục chụp ảnh báo cáo
(thứ tự màn hình), mỗi màn light + dark. Điểm cần thấy: primary indigo trên
FAB/nút/icon; dark nền `#1B1B21`; badge camera trên avatar vẫn đọc được
(trắng trên `#505B92` 6.46:1).

## Câu hỏi vấn đáp và trả lời gợi ý

**Vì sao cần RLS khi client đã filter `user_id`?**

Client do người dùng kiểm soát và filter có thể bị bỏ/sửa. RLS chạy trong Postgres, kiểm tra JWT qua `auth.uid()` cho mọi request nên mới là ranh giới bảo mật.

**Publishable/anon key có phải secret không?**

Không; key này nằm trong client và chỉ nhận quyền của role public/authenticated. An toàn dữ liệu phụ thuộc RLS. `service_role` mới tuyệt đối không được đưa vào app vì có thể vượt RLS.

**Vì sao `profiles.id` tham chiếu `auth.users.id`?**

Quan hệ một-một đơn giản: cùng UUID vừa xác định profile vừa đối chiếu `auth.uid()`, và `on delete cascade` tránh dữ liệu mồ côi.

**Trigger tạo profile để làm gì?**

Đảm bảo mỗi Auth user có profile dù client đóng app ngay sau sign-up; invariant nằm ở database thay vì phụ thuộc hai request từ client.

**Vì sao UPDATE cần cả `USING` và `WITH CHECK`?**

`USING` giới hạn row được chọn để sửa; `WITH CHECK` giới hạn giá trị sau sửa, ngăn đổi `user_id` sang người khác.

**AsyncStorage dùng để làm gì?**

Là storage adapter để Supabase JS duy trì session React Native giữa các lần mở app; không dùng để lưu profile/note làm nguồn dữ liệu chính.

**React Query khác React Hook Form thế nào?**

React Query quản lý dữ liệu server/caching/invalidation; React Hook Form quản lý input và trạng thái form cục bộ; Zod định nghĩa validation.

**Token hết hạn xử lý thế nào?**

Supabase tự refresh khi app foreground nếu refresh token còn hợp lệ. Nếu refresh thất bại, app xóa cache riêng tư và đưa về sign-in.

**Tại sao bucket avatar là private?**

Avatar là dữ liệu tài khoản. Private bucket buộc truy cập qua policy/signed URL, thể hiện rõ quyền sở hữu thay vì URL công khai vĩnh viễn.

**Vì sao chỉ có `study_notes`?**

FR-05 yêu cầu chứng minh cách ly dữ liệu học tập; title/content và CRUD là mẫu nhỏ nhất đủ kiểm chứng, tránh mở rộng ngoài đề.

**Nếu thao tác offline thì sao?**

Phạm vi không có offline-first. UI giữ form, báo lỗi và cho retry; không giả lập thành công hay tự tạo hàng đợi đồng bộ.

**Vì sao không viết backend riêng?**

Supabase cung cấp Auth, Data API, Postgres RLS và Storage đủ cho phạm vi; backend riêng làm tăng code và điểm lỗi mà không thêm giá trị cho năm FR.

**Vì sao FR-03 dùng OTP 6 số thay vì deep link?**

Deep link reset-password bắt user bấm link trong email để mở lại app: trên Expo Go phải cấu hình scheme/associated domain, dễ hỏng khi đổi máy, và luồng phụ thuộc app mail mở đúng app. OTP 6 số giữ toàn bộ luồng trong app (`resetPasswordForEmail` → `verifyOtp` type `recovery` → `updateUser`), không cần scheme/deep link nên chạy ngay trong Expo Go. Trade-off: user phải gõ/dán 6 số (khắc phục bằng ô numeric tự focus + `oneTimeCode`/`sms-otp` gợi ý dán), mã có hạn dùng ngắn và mỗi mã một lần (khắc phục bằng nút gửi lại + cooldown 60s). SPEC chốt OTP là luồng chính, deep link chỉ là bonus.

**Vì sao phải dùng custom SMTP (Brevo) cho email reset?**

Gói free của Supabase dùng email service mặc định không cho sửa nội dung Email Templates — template Reset password mặc định chỉ chứa đường link, không in được mã `{{ .Token }}`. Muốn email hiển thị OTP 6 số để nhập trong app thì phải cắm custom SMTP (ở đây là Brevo) mới được sửa template. Kèm theo đó rate limit email được nâng lên 100/giờ; app vẫn map lỗi `over_email_send_rate_limit` sang thông báo rõ ràng và khóa nút gửi lại 60 giây để chống spam.

**Vì sao email gửi mã 8 số trong khi app ban đầu chỉ nhận 6 số?**

Độ dài OTP là cấu hình phía server (`mailer_otp_length`, cho phép 6–10, mặc định 6) — xem ở Dashboard Authentication → Sign In/Providers → Email → “Email OTP length”. Project từng để 8 nên email in 8 số trong khi app cứng `^\d{6}$`, mã đúng cũng bị chặn ngay tại field. Bài học: validate client chỉ là UX, còn `verifyOtp` mới quyết định mã đúng/sai. Chủ dự án đã chỉnh setting về 6 nên server chỉ gửi 6 số; app khóa chặt đúng 6 số cho khớp SPEC.

**Supabase có tiết lộ email tồn tại khi quên mật khẩu không?**

Không. `resetPasswordForEmail` luôn trả thành công dù email chưa đăng ký, nên màn hình `/forgot-password` hiện cùng một thông báo trung tính cho mọi email — chống liệt kê tài khoản.

**Thoát app giữa lúc reset mật khẩu thì sao?**

Email đang verify + thời điểm gửi mã lưu trong AsyncStorage nên mở lại app vẫn điền sẵn email và giữ cooldown. Nếu đã verify xong (recovery session còn hạn), route `/` đưa thẳng về `/reset-password` để đặt mật khẩu. Màn hình reset yêu cầu cả session lẫn cờ pending nên user login thường không dùng ké được.

**Vì sao avatar dùng private bucket + signed URL thay vì public URL?**

Avatar là dữ liệu tài khoản. Bucket private buộc mọi lượt đọc qua Storage policy (`foldername = auth.uid()`); signed URL TTL 3600s chỉ có hạn, app cache 55 phút rồi xin mới. DB chỉ lưu path, không lưu URL — URL lộ ra ngoài cũng tự hết hạn, còn public URL vĩnh viễn thì ai có link cũng xem được mãi.

**Vì sao upload avatar phải base64 → ArrayBuffer mà không dùng `fetch(uri).blob()`?**

Polyfill `fetch`/`blob` trong React Native lỗi với file local: `blob()` thường trả về 0 byte khiến Storage lưu file rỗng. `expo-image-manipulator` trả sẵn chuỗi base64 sau khi resize/nén; `base64-arraybuffer` decode thành ArrayBuffer mà `supabase.storage.upload` nhận trực tiếp với `contentType: 'image/jpeg'` — hết 0-byte, hết phụ thuộc polyfill.

**Vì sao path avatar có timestamp thay vì ghi đè một file?**

Quyết định chủ dự án G5: mỗi lần đổi tạo object mới `avatar_<ms>.jpg`, update DB xong mới xóa object cũ best-effort. Lợi: không bao giờ mất avatar nếu upload giữa chừng thất bại; hại: nếu xóa cũ lỗi sẽ đọng rác (chấp nhận được, đã log warning).

**Lỗi signInWithPassword làm sai kết quả proof script là sao?**

Bài học G5: gọi `signInWithPassword` trên client dùng chung khiến client đó mang session user A, nên case "anon" chạy nhầm quyền A và cho kết quả sai (anon đọc được file). Sửa bằng cách tách client đăng nhập riêng, giữ client anon thật sự ẩn danh — sau đó script 5/5 PASS.

**Vì sao DOCX dùng được ở CN2 nhưng AI không nhận?**

Quyết định sản phẩm có chủ đích: DOCX được tải lên, xem, đổi tên, xóa, gán
môn đầy đủ nên FR-07 (“hỗ trợ định dạng”) vẫn thỏa. Nhưng Gemini không đọc
trực tiếp DOCX và không có thư viện trích xuất DOCX nào chạy được trên
Expo Go, nên DOCX nhận `extraction_status = 'unsupported'` và UI gợi ý chuyển
sang PDF. CN3 → CN6 chỉ nhận PDF/TXT.

**Vì sao FR-13 tách làm hai nửa CN2/CN3?**

CN2 không có API key AI hay Edge Function nên chỉ làm hạ tầng: bảng
`documents` có sẵn `extracted_text` (nullable) và `extraction_status`
(`pending`/`processing`/`done`/`failed`/`unsupported`). CN3 gọi Gemini trích
nội dung rồi đổ vào hai cột đó. Tách như vậy CN2 làm được ngay mà FR-13
không bị bỏ sót.

**Vì sao tìm kiếm tài liệu PHÂN BIỆT DẤU tiếng Việt?**

Giới hạn đã chốt ở CN2-G2 (không phải bug bỏ sót): ô tìm kiếm dùng `ilike`
trên `display_name` nên “bai” không ra “bài”. Muốn tìm không dấu phải dùng
hàm `unaccent` của Postgres, nhưng `unaccent` không immutable nên không đánh
index trực tiếp được — bật extension + index expression ở giai đoạn này tốn
chi phí demo mà lợi ít, nên SPEC chốt giữ `ilike` phân biệt dấu. Unit test
`matchesDocumentSearch` khóa hành vi này (gõ không dấu → false).

**Vì sao không có viewer xem tài liệu trong app?**

Quyết định CN2-1 của chủ dự án: đề FR-06→FR-13 không yêu cầu xem nội dung;
WebView trên Android không render được PDF (phải nhờ dịch vụ bên thứ ba).
Nút “Mở tài liệu” chỉ tạo signed URL TTL 3600s rồi `Linking.openURL` ra app
ngoài (tiện ích ngoài FR, mức tối thiểu, không thêm package). `Linking` nằm
trong `react-native` core. Mở lỗi (không có app xử lý, hết hạn URL) thì báo
tiếng Việt rõ ràng, có `canOpenURL` kiểm tra trước.

**Vì sao icon Paper không hiện trên Expo Go và sửa thế nào?**

`react-native-paper` resolve icon qua `react-native-vector-icons`, package
này không có trong Expo Go nên mọi icon (mắt mật khẩu, FAB, Appbar, Banner)
render rỗng im lặng mà không báo lỗi. Fix: `PaperProvider`
`settings={{ icon: (props) => <MaterialCommunityIcons {...props} /> }}`
với `MaterialCommunityIcons` từ `@expo/vector-icons` (cài đúng line SDK 57
bằng `npx expo install`, chạy trong Expo Go không cần dev build). Tên icon
sai cũng render rỗng nên toàn bộ tên đã đối chiếu glyphmap thật và liệt kê
trong `docs/ARCHITECTURE.md` (bảng icon ở mục “Luồng màn hình”).

**Vì sao đổi theme sang seed indigo `#4A5FC1` và làm sao biết không vỡ tương phản?**

Task CN2-13 cố ý đặt cuối cùng vì đổi theme sớm làm hỏng mọi ảnh báo cáo.
Bảng màu sinh bằng Material Theme Builder (`material-color-utilities`,
variant TonalSpot) rồi giữ nguyên ánh xạ tone → token của Paper nên mọi cặp
chữ/nền vẫn đạt WCAG AA (yếu nhất 4.98:1, đã tính tay và ghi trong
`docs/DESIGN-SYSTEM.md`). `adaptNavigationTheme` gọi một lần ở module scope
(gọi trong render sẽ remount navigator). Unit test `theme.test.ts` khóa giá
trị palette chống regress về tím mặc định.

## Hỏi đáp CN3 — AI tóm tắt (chuẩn bị từ session `docs/cn3`, chờ code)

**Vì sao tóm tắt phải bấm nút thay vì tự động sau upload?**

Mỗi lần tóm tắt tốn đúng một request quota miễn phí (khoảng 1.500 lượt/ngày
cho cả project demo). Tự động sau upload sẽ đốt quota cho file user chưa cần
đọc, một buổi test là hết quota cả lớp. Nút bấm vừa tiết kiệm quota vừa là
chốt chặn gọi lặp tự nhiên nhất.

**Vì sao bản tóm tắt nằm ở bảng riêng thay vì thêm cột vào `documents`?**

Tách vòng đời: tóm tắt lại chỉ UPDATE một row (`UNIQUE(document_id)` đảm bảo
mỗi tài liệu một bản đang dùng); `documents` không phình thêm;
`extracted_text` của CN2 giữ nguyên cho CN4 hỏi đáp; RLS viết độc lập theo
`user_id`; xóa tài liệu kéo theo xóa summary qua `ON DELETE CASCADE`, không
cần bước xóa riêng.

**Vì sao không cần thư viện trích xuất PDF mà FR-15 vẫn thỏa?**

Không có lib PDF nào chạy trên Expo Go (đều cần native module → development
build, trái quyết định đã chốt). Gemini 2.5 Flash đọc PDF trực tiếp bằng
native vision: app gửi nguyên file base64 inline là xong, FR-15 thỏa mà stack
không thêm package nào.

**Ngưỡng file gửi Gemini là bao nhiêu, vượt thì sao?**

Tra tài liệu Google ngày 2026-09-19: inline data tối đa 100 MB/request,
riêng PDF 50 MB. App chặn 10 MB từ CN2 nên mọi tệp hợp lệ đều gửi nguyên file
được, không chia nhỏ. Vượt ngưỡng (chỉ khi luật CN2 đổi) thì từ chối trước khi
gọi và báo rõ — chunking ngoài đề nên không làm.

**Free tier ~1.500 request/ngày thì demo thế nào?**

Ba lớp chống chạm trần: nút disabled khi đang chạy + guard `processing` trong
`requestSummary` + `UNIQUE(document_id)` chặn ghi đôi (mỗi lần bấm tối đa một
request, không auto-retry). Chạm trần thật thì UI báo rõ giới hạn và giờ reset
(nửa đêm giờ Thái Bình Dương), không treo spinner.

**App bị kill giữa lúc tóm tắt thì sao?**

Trạng thái kẹt ở `processing`. Không có cron server nên màn chi tiết tự thu
hồi: `processing` mà `updated_at` quá 15 phút thì app đưa về `failed` và cho
“Thử lại”. Mốc giờ lấy từ trigger `updated_at` có sẵn, không thêm cột.

**API key Gemini để ở đâu, có an toàn không?**

Đường đúng: Edge Function proxy giữ key trong secret Supabase, app chỉ gửi
JWT (probe ở CN3-01; tag `edge-probe` được nhắc trong lệnh nhưng không tồn
tại nên probe làm lại từ đầu). Nếu probe thất bại, bản demo dùng
`EXPO_PUBLIC_GEMINI_API_KEY` — key trong bundle giải nén ra được nên ĐÂY LÀ
GIỚI HẠN ĐÃ BIẾT CỦA BẢN DEMO, không dùng cho bản thật: key phải restrict
riêng Gemini API trong Google Cloud Console (từ 2026-06-19 Google chặn key
không restrict), quota free vẫn tính theo project, và lộ key đồng nghĩa người
khác đốt quota của mình.
