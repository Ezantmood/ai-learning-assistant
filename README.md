# AI Learning Assistant

Ứng dụng học tập Expo Go, gồm 6 chức năng và 45 FR theo đề PDF gốc.
Đợt đối chiếu 2026-10-20 phát hiện 13 FR thiếu và 5 FR một phần trong bản
cũ; đã bổ sung luồng code và sửa cách truy vết yêu cầu. Bằng chứng trước/sau:
[FR-AUDIT](docs/FR-AUDIT.md), [truy vết 45 FR](docs/FR-TRACEABILITY.md).
Kiểm thử tự động và API không thay thế kiểm thử Expo Go trên điện thoại.

## Chức năng

| Chức năng | FR | Hành vi |
|---|---|---|
| Tài khoản | 01–05 | Email/mật khẩu, OTP khôi phục, hồ sơ/avatar, ghi chú riêng |
| Tài liệu | 06–13 | Upload PDF/DOCX/TXT, CRUD, môn/chủ đề, lưu nội dung cho AI |
| Tóm tắt | 14–22 | Ngắn/trung bình/chi tiết, theo chương/phần, cấu trúc dễ đọc, lịch sử nhiều bản |
| Hội thoại | 23–30 | Theo tài liệu và ngữ cảnh phiên, phiên mới, tùy chọn lưu/mở lại |
| Quét đề | 31–37 | Camera/thư viện, OCR, kiểm tra/sửa văn bản, gửi bản sửa sang phân tích |
| Giải bài | 38–45 | Phân tích dạng bài, gợi ý tiếp, giải thích, lời giải theo yêu cầu, hỏi tiếp |

Trang chủ có hai lối Tải tài liệu/Quét đề; chi tiết chia Tóm tắt/Hỏi đáp/
Giải bài và giữ bản nháp khi đổi mục. Các thao tác quản lý/phạm vi/chế độ
phụ mở khi cần. Luồng ảnh dẫn từng bước đến nội dung đã kiểm tra.

## Stack và chạy app

Expo SDK 57, TypeScript strict, expo-router, Supabase Auth/Postgres/Storage,
AsyncStorage, React Hook Form, Zod, TanStack Query, React Native Paper.
Giữ nguyên dependency; không prebuild/eject/development build.

```bash
npm ci
# cấu hình .env và .env.local theo docs/SETUP.md; không commit giá trị
npx expo start -c
```

Dùng Expo Go tương thích SDK 57. Nếu Wi-Fi trường có client isolation:
điện thoại phát hotspot → Mac kết nối → chạy lại lệnh trên → quét QR mới.
Không dùng --tunnel. Hướng dẫn môi trường, OTP và thứ tự SQL:
[SETUP](docs/SETUP.md).

## Kiểm chứng

```bash
npx tsc --noEmit
npm run lint
npm test -- --runInBand
npm run check:functions
node --env-file=.env --env-file=.env.local scripts/fr-audit-proof.mjs
node --env-file=.env.local scripts/ai-smoke.mjs
```

Mốc tự động sau xử lý quota: 44 suites / 342 test; lint 0 lỗi/0 warning; RLS A/B 51/51;
đối chiếu 57 cột types với schema remote, verify CN2 14/14 và CN3 10/10.
Android bundle export đạt. Các ca thiết bị ở [TEST-CHECKLIST](docs/TEST-CHECKLIST.md)
vẫn để mở nếu chưa chạy. Script proof tạo/dọn user/object test; service-role
chỉ dùng local, không nằm trong app.

## AI và giới hạn thực tế

Model chung: `gemini-3.5-flash-lite` stable; smoke 10/10 gồm PDF, OCR và
hội thoại/solver đã đạt ngày 2026-10-21. Model 3.6 cũ của project hết quota
Free Tier 20 yêu cầu/ngày. AI Studio đúng project ngày 2026-10-21 xác nhận
Flash-Lite: **15 yêu cầu/phút, 250K token/phút, 500 yêu cầu/ngày**; hạn mức
ngày gấp 25 lần model cũ. Các chức năng AI dùng chung ngân sách của model
trong project; đây không phải API vô hạn hay cam kết khả năng phục vụ.
3.8 Flash gặp timeout/503 khi probe nên chưa chọn làm mặc định.
Minimal cho hỏi đáp/OCR/tóm tắt văn bản, low cho trích PDF/gợi ý, medium
cho lời giải đầy đủ. Tóm tắt lại tái dùng toàn văn đã trích. Timeout 90 giây;
không tự retry, không hứa hạn mức cố định hay thời gian phản hồi cố định.
Xem số đo và các lỗi dịch vụ trong [FR-AUDIT](docs/FR-AUDIT.md).

Gói Google AI Pro và Gemini Developer API có billing/quota riêng; app dùng
API key của project trong AI Studio. Pro hiện có quyền lợi $10 Cloud
credits/tháng qua Developer Program, cần nhận và gắn đúng billing account;
key hiện tại vẫn Free Tier. Không tự bật billing/nâng gói.
[Quyền lợi Pro](https://support.google.com/googleone/answer/14534406?hl=en),
[billing Google](https://ai.google.dev/gemini-api/docs/billing).
Trước demo chạy một lượt `node --env-file=.env.local scripts/ai-smoke.mjs --only=preflight`;
đọc RPM/RPD/TPM và hướng dẫn nhận credits trong [SETUP mục 7](docs/SETUP.md#7-trước-buổi-demo-kiểm-hạn-mức-api).
Key EXPO_PUBLIC_GEMINI_API_KEY vẫn nằm trong bundle bản demo; cần backend
proxy trước khi phát hành cho người dùng thật. Không đưa service-role vào app.

DOCX upload/mở/quản lý được, AI yêu cầu chuyển PDF. Kết nối mạng là bắt buộc;
không offline-first. Mỗi phiên hội thoại chưa lưu mất khi rời màn; chỉ lần hỗ
trợ giải bài gần nhất lưu DB, các lượt trong phiên giữ để hỏi tiếp.

## Tài liệu

[SPEC](docs/SPEC.md) · [Kiến trúc](docs/ARCHITECTURE.md) ·
[Dữ liệu/RLS](docs/DATA-MODEL.md) · [TASKS](docs/TASKS.md) ·
[DEVLOG](docs/DEVLOG.md) · [Báo cáo](docs/REPORT-NOTES.md) ·
[Quy tắc dự án](AGENTS.md).
