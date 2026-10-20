# Dựng và kiểm tra AI Learning Assistant

Giữ Expo SDK 57/Expo Go và package-lock hiện có. Không prebuild/eject.
Nếu package deprecated/không tương thích thì dừng và báo chủ dự án.

## 1. Môi trường

Node 22.13 trở lên theo stack dự án, npm/Git; Expo Go tương thích SDK 57.
Kiểm bản Expo Go tại expo.dev/go cho thiết bị; không tự đổi SDK để vừa app.
Supabase project phải đang hoạt động; nếu bị pause thì resume trên Dashboard.

```bash
npm ci
npx tsc --noEmit
```

## 2. Cấu hình local

Copy .env.example thành .env, tạo .env.local nếu cần. Chỉ tên biến:
EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
EXPO_PUBLIC_REQUIRE_EMAIL_CONFIRMATION, EXPO_PUBLIC_GEMINI_API_KEY.
Key Gemini thường đặt ở .env.local. Shell đã export có thể ưu tiên file;
kiểm tên/nguồn biến khi app báo chưa cấu hình, không in giá trị key.
Dừng Metro rồi npx expo start -c sau khi sửa env.

SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DB_URL, SUPABASE_ACCESS_TOKEN,
SUPABASE_PROJECT_REF và PROBE_EMAIL/PROBE_PASSWORD chỉ phục vụ script local,
không dùng prefix EXPO_PUBLIC cho secret quản trị. Không commit .env/.env.local.

Gemini Developer API key lấy trong Google AI Studio của project, billing/quota
riêng với gói Google AI Pro; không tự bật billing. Model src/shared/ai/models.ts
hiện gemini-3.5-flash-lite stable (smoke 2026-10-21 đạt cả PDF/ảnh).
3.6 của project hết quota Free Tier 20 lượt/ngày; 3.8 từng timeout/503.
[Tài liệu model](https://ai.google.dev/gemini-api/docs/models),
[billing](https://ai.google.dev/gemini-api/docs/billing).

Key Gemini vẫn trong bundle bản demo dù gửi bằng header. Backend proxy là
việc cần hoàn tất trước phát hành thật; lịch sử proxy 401/403 ở DEVLOG và
REPORT-NOTES, không làm theo hướng dẫn proxy cũ như cấu hình app hiện hành.

## 3. Supabase schema và Storage

Tạo project, lấy Project URL/publishable key cho app. Dán toàn bộ từng file
SQL vào Dashboard SQL Editor theo thứ tự:

0001_account_manager.sql → 0002_cn2_documents.sql → 0004_cn3_summaries.sql →
0005_cn4_questions.sql → 0006_cn5_scan_images.sql → 0007_cn6_solutions.sql →
0008_summary_history.sql → 0009_conversation_sessions.sql → 0010_solver_modes.sql →
0011_parent_ownership_rls.sql.

Không có 0003. Không chạy lại migration cũ sau khi đã lên schema mới.
Project hiện tại đã áp 0008..0011 trong đợt audit 2026-10-20; không cần dán lại.
Không dùng db push để vượt lỗi PAT thiếu quyền. Nếu dùng kết nối Postgres
đã được cấp để vận hành, giữ URL/password ngoài repo và không in log.

Kiểm 7 bảng đều RLS enabled; avatars/documents private, giới hạn 2/10 MB.
Bucket documents có 8 MIME gồm tài liệu + ảnh; subjects 4 policy, documents
và 3 bảng kết quả có 4 CRUD + 1 restrictive. Xem DATA-MODEL.md.
Chạy scripts/cn2-schema-verify.sql (14/14), cn3-schema-verify.sql (10/10)
trên SQL Editor để đọc catalog, không thay đổi dữ liệu.

## 6. Cấu hình Supabase Auth (Dashboard, làm tay)

1. Authentication → Providers/Sign In → **Email**: Enabled ON, Allow new users
   to sign up ON, **Confirm email OFF** khi dev (bật lại khi demo).
2. Authentication → **Custom SMTP**: cắm Brevo (email mặc định của gói free
   không cho sửa template). Lấy host/user/key từ tài khoản Brevo, lưu ngoài repo.
3. Authentication → Email Templates → **Reset Password**: thay nội dung link
   bằng mã `{{ .Token }}` để email in OTP 6 số.
4. Authentication → Sign In/Providers → Email → **Email OTP length = 6**
   (khớp `otpSchema` `^\d{6}$` của app; server từng để 8 gây chặn oan, xem DEVLOG G4).
5. Rate limit email mặc định sau custom SMTP: **100 email/giờ**; app map lỗi
   `over_email_send_rate_limit` và khóa nút gửi lại 60s.


## 5. Chạy app và kiểm chứng

```bash
npx expo start -c
npx tsc --noEmit
npm run lint
npm test -- --runInBand
npm run check:functions
node --env-file=.env --env-file=.env.local scripts/fr-audit-proof.mjs
node --env-file=.env.local scripts/ai-smoke.mjs
```

Proof tạo hai tài khoản giả bằng service-role local, thao tác bằng publishable
key + JWT, dọn user/object trong finally. Kết quả mong đợi FR_AUDIT_PROOF 51/51.
Smoke AI dùng dữ liệu học tập mẫu, gọi API thật và không ghi DB. Có thể thêm
đường dẫn JPEG và PDF mẫu làm hai tham số; --only=pdf chạy riêng PDF. Đây là
các lượt kiểm thử do người chạy chủ động gọi, app không tự retry khi lỗi.
503/timeout/quota là ca dịch vụ phải báo rõ, không sửa log thành pass.

Checklist tay đầy đủ ở TEST-CHECKLIST.md, các mục 19→22 theo đề PDF.
Web/unit không thay kiểm camera, quyền ảnh, OTP email và file picker Expo Go.

## 6. Mạng và keep-alive

Wi-Fi trường/công cộng có client isolation: điện thoại phát hotspot, Mac
kết nối vào đó, npx expo start -c rồi quét QR mới. Không dùng --tunnel.

Workflow .github/workflows/keep-alive.yml dùng GitHub secrets SUPABASE_URL /
SUPABASE_ANON_KEY để gọi Auth health; không commit giá trị. Trước demo kiểm
project đang hoạt động; không suy ra mọi chức năng AI khỏe chỉ từ health 200.


## 7. Trước buổi demo: kiểm hạn mức API

Chạy một lượt kiểm ngắn, không chạy full smoke liên tục trước giờ demo:

```bash
node --env-file=.env.local scripts/ai-smoke.mjs --only=preflight
```

Lệnh gửi đúng một yêu cầu bằng model trong code; PASS chỉ xác nhận hiện tại
API trả lời được, không đo số lượt còn lại và không bảo đảm buổi demo.
Nếu fail: đọc lỗi ngày/phút/chưa có quota/số dư, không bấm lại liên tục.
App không tự retry hoặc luân phiên key để vượt giới hạn.

Quan sát thật 2026-10-21: model 3.6 của key hiện có trả 429 với quota
`GenerateRequestsPerDayPerProjectPerModel-FreeTier`, giá trị 20. Sau đó đọc
[AI Studio Rate limits](https://aistudio.google.com/rate-limit?timeRange=last-28-days)
bằng Chrome đã đăng nhập, chọn đúng project chứa key, tier vẫn **Free**:

| Model | RPM (yêu cầu/phút) | TPM (token/phút) | RPD (yêu cầu/ngày) |
|---|---:|---:|---:|
| Gemini 3.6 Flash cũ | 5 | 250K | 20 |
| **Gemini 3.5 Flash Lite đang dùng** | **15** | **250K** | **500** |
| Gemini 3.1 Flash Lite | 15 | 250K | 500 |

Chọn 3.5 Lite: hạn mức ngày gấp 25 lần, phút gấp 3 lần model cũ và đã kiểm
cả PDF/ảnh/ngữ cảnh. Chủ dự án chọn miễn phí hoàn toàn; không bật billing,
không nạp tiền. Các con số thuộc project/model tại thời điểm đọc, cần kiểm
lại trước buổi demo; thay key cùng project không tăng quota. Tóm tắt, hỏi
đáp, OCR và giải bài dùng chung hạn mức này. Tránh bấm nhiều yêu cầu cùng lúc.
Ngày quota đặt lại lúc 0 giờ Pacific, tương ứng khoảng 14–15 giờ Việt Nam
tùy mùa. Bảng Peak usage 28 ngày không phải số lượt còn lại hôm nay; số liệu
có thể trễ tới 15 phút. Không suy 13/500 thành còn 487 lượt.
[Tài liệu rate limits](https://ai.google.dev/gemini-api/docs/rate-limits).

Google AI Pro hiện có quyền lợi $10 Google Cloud credits/tháng qua
Developer Program. Cần liên kết hồ sơ và nhận credits cho billing account
đúng; thuê bao không tự chuyển key Free Tier hiện tại thành Paid Tier.
Kiểm eligibility/tình trạng thật trong [My Benefits](https://developers.google.com/profile/u/me/my-benefits);
nguồn [Google One](https://support.google.com/googleone/answer/14534406?hl=en)
và [Benefits FAQ](https://developers.google.com/profile/help/benefits).

Nếu quyết định dùng Paid Tier: chủ dự án tự hoàn tất Set up billing ở
[AI Studio Projects](https://aistudio.google.com/projects), đúng project của
key; tài khoản Prepay mới thường cần nạp tối thiểu $5 và có số dư dương
trước khi dùng credits khuyến mại hợp lệ. Xác nhận trong Billing rằng
credits đã được áp dụng, đặt spend cap phù hợp, kiểm auto-reload theo ý
chủ tài khoản. Spend cap có độ trễ xử lý khoảng 10 phút, không coi là trần
chi phí tuyệt đối. Agent không tự nạp tiền/bật tự động thanh toán.
[Billing và Prepay](https://ai.google.dev/gemini-api/docs/billing).

Chuẩn bị một PDF/ảnh ngắn, một bản tóm tắt và hội thoại đã lưu để có nội
dung xem lại khi mạng/dịch vụ trục trặc. Nói rõ phần nào là kết quả đã lưu;
không giả vờ dữ liệu lưu sẵn là AI đang sinh trực tiếp. Không có nhà cung
cấp API công cộng nào được chốt là vô hạn trong dự án này; Groq/Cerebras
cũng áp giới hạn, đổi provider cần key và kiểm đủ PDF/ảnh/ngữ cảnh.

Model 3.5 Flash-Lite đã qua smoke 10/10 và preflight 1/1 với key hiện có.
Quota 500 RPD/15 RPM được đọc trực tiếp trong AI Studio đúng project, không
suy từ tên model hoặc bài tổng hợp. Kết quả mẫu không bảo đảm mọi tài liệu
hay độ trễ cố định. Xem bằng chứng `docs/evidence/ai-demo-quota-20261021.txt`.
