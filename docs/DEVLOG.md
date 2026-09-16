# Nhật ký phát triển

File này chỉ ghi kết quả đã xảy ra; không chép lại backlog. Sau mỗi giai đoạn, thêm một mục theo mẫu dưới đây. Không ghi secret, email thật hoặc token.

## Mẫu ghi sau mỗi giai đoạn

### Gx — Tên giai đoạn — YYYY-MM-DD

**Đã làm gì**

- ...

**Quyết định và lý do**

- Quyết định: ...
- Lý do: ...

**Đã kiểm thử**

- Lệnh: `npx tsc --noEmit` → kết quả ...
- Lệnh: `npm run lint` → kết quả ...
- Test tay: case ... → kết quả ...

**Còn nợ / giới hạn đã biết**

- ... hoặc “Không”.

**Mốc Git**

- Commit cuối: `<full-hash>`
- Branch: `feat/gx-...`
- Tag: `gx-done` (chỉ ghi sau khi merge và push tag; trước đó ghi “chưa tạo”)
- PR: `<URL hoặc số PR>`

---

## Nhật ký

### G1 — Nền Expo và cấu hình — 2026-09-16

**Đã làm gì**

- Khởi tạo Expo SDK 57 + TypeScript strict + expo-router để chạy bằng Expo Go.
- Cài stack bắt buộc, tạo Paper/React Query providers.
- Validate ba biến env; tạo Supabase client lưu session bằng AsyncStorage và refresh theo AppState.
- Tạo route skeleton, session restore và guard cho nhóm public/private; chưa có nghiệp vụ Auth.
- Cập nhật tài liệu theo quyết định OTP 6 số và tắt email confirmation khi dev.

**Quyết định và lý do**

- Dùng OTP recovery thay deep link để luồng chính chạy trực tiếp trong Expo Go.
- Dùng ESLint 9 do `eslint-plugin-react` đi kèm Expo SDK 57 chưa hỗ trợ ESLint 10; không đổi plugin ngoài stack.

**Đã kiểm thử**

- `npx tsc --noEmit` → đạt.
- `npm run lint` → đạt.
- `npx expo install --check` → dependencies đúng SDK 57.
- Metro bundle iOS/Android → đạt; router root là `app/`, runtime `exposdk:57.0.0`.
- Chưa quét QR trên thiết bị thật vì cần chủ dự án điền Supabase env.

**Còn nợ / giới hạn đã biết**

- `npm audit` báo 14 moderate ở dependency Expo SDK 57; đề xuất fix là downgrade major sai stack nên không tự áp dụng.
- npm đánh dấu ESLint 9 hết hỗ trợ, nhưng ESLint 10 hiện làm `eslint-plugin-react@7.37.5` của Expo lỗi runtime.

**Mốc Git**

- Commit triển khai cuối: `7d14650a60dd054454f0b70ee83b61cf6ca53147`
- Branch: `feat/g1-setup`
- Tag: chưa tạo; chỉ tạo `g1-done` sau khi chủ dự án merge.
- PR: tạo sau commit tài liệu kết thúc G1.
