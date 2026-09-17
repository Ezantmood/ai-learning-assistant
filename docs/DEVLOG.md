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

---

### G2 — Database, RLS và Storage — 2026-09-17

**Đã làm gì**

- Viết `supabase/migrations/0001_account_manager.sql`: bảng `profiles`/`study_notes` kèm constraints/index, trigger `handle_new_user`/`set_updated_at`, RLS đủ 4 lệnh mỗi bảng và bucket private `avatars` với 4 Storage policy.
- Viết `docs/RLS-PROOF.md`: kịch bản A/B chứng minh FR-05 (SELECT chéo 0 dòng, INSERT/UPDATE/DELETE chéo bị chặn) kèm từng câu lệnh và kết quả mong đợi.
- Bổ sung `docs/DATA-MODEL.md`: giải thích vì sao chỉ lọc `.eq('user_id', uid)` ở client không an toàn và RLS mới là ranh giới bảo mật.
- Viết `src/types/database.ts` mirror từ migration (regen bằng CLI sau khi apply remote).
- Đánh dấu 3 checkbox G2 trong `docs/TASKS.md`; chuyển FR-04/FR-05 sang `đang làm` trong `docs/FR-TRACEABILITY.md`.

**Quyết định và lý do**

- Quyết định: tách `feat/g2-database` từ HEAD chứa code G1 thay vì `main` cũ, vì PR G1 (#1) vẫn OPEN và `main` chưa có code G1.
- Lý do: tạo từ `main` cũ sẽ mất toàn bộ code G1; branch G2 sẽ rebase/merge sau khi PR G1 được merge.
- Quyết định: `database.ts` viết tay mirror migration thay vì regen bằng CLI.
- Lý do: chưa có project ref/access token trong session này; file ghi rõ lệnh regen sau khi apply migration remote.

**Đã kiểm thử**

- Lệnh: `npx tsc --noEmit` → đạt (trước mỗi commit).
- Lệnh: `npm run lint` → đạt (trước mỗi commit).
- Migration chạy 2 lần liên tiếp trên Postgres 16 local (mock schema `auth`/`storage`) → không lỗi lần nào.
- Trigger: insert user hợp lệ tạo đúng 1 profile; thiếu `student_code` báo lỗi; trùng `student_code` đúng hoa/thường báo unique violation; `SV001` và `sv001` cùng tồn tại (case-sensitive); UPDATE bump `updated_at`.
- Chưa chạy migration trên Supabase remote và chưa test A/B thực tế — chủ dự án chạy SQL Editor và `docs/RLS-PROOF.md` rồi ghi kết quả vào `docs/TEST-CHECKLIST.md`.

**Còn nợ / giới hạn đã biết**

- Cần apply migration lên Supabase project thật và regen `database.ts` bằng CLI.
- Kịch bản A/B trong `docs/RLS-PROOF.md` chưa có kết quả chạy thật.

**Mốc Git**

- Commit triển khai cuối: `5994f71cefbb094e818a149d7fc9f89c68b8adb6`
- Branch: `feat/g2-database`
- Tag: chưa tạo; chỉ tạo `g2-done` sau khi chủ dự án merge.
- PR: tạo sau commit tài liệu kết thúc G2.

- [G2] Retarget PR #2 base: main → feat/g1-setup (vì PR #1 chưa merged, base main sẽ show lẫn code G1).
