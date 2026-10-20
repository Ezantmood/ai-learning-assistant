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
hiện gemini-3.6-flash stable. 3.8 từng timeout/503 khi kiểm tra.
[Tài liệu model](https://ai.google.dev/gemini-api/docs/models/gemini-3.6-flash),
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
