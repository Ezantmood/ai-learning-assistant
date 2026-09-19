# AGENTS.md

## Phạm vi và mục tiêu

- Hệ thống duy nhất **AI Learning Assistant**: 6 chức năng, 45 FR (FR-01 → FR-45).
- Chức năng 1 (tài khoản, FR-01 → FR-05) đã hoàn thành; FR-06 → FR-45 làm ở session sau.
- Mỗi session chỉ làm đúng phạm vi được giao; không tạo module, bảng, route hay abstraction dự phòng.
- Ưu tiên code ngắn, rõ, sinh viên có thể tự giải thích và bảo vệ.

## Stack cố định

- Expo SDK 57, TypeScript `strict`, `expo-router`.
- Supabase Auth + Postgres + Storage, `@supabase/supabase-js` v2.
- `@react-native-async-storage/async-storage` để lưu session.
- `react-hook-form`, `zod`, `@tanstack/react-query`, `react-native-paper`.
- Chạy bằng Expo Go; không dùng development build. FR-03 dùng OTP 6 số qua email, không phụ thuộc deep link.
- Cài dependency bằng `npx expo install`; không tự thay package/version. Nếu deprecated hoặc không tương thích SDK 57 thì dừng và báo chủ dự án.

## Lệnh chuẩn

- Dev: `npx expo start`
- Type check: `npx tsc --noEmit`
- Lint: `npm run lint`
- Test tay: theo `docs/TEST-CHECKLIST.md`
- Không tự chạy prebuild/eject hoặc sinh `ios/`, `android/`.

## Cấu trúc và đặt tên

- Route chỉ đặt trong `app/`; nghiệp vụ theo feature đặt trong `src/features/<ten-chuc-nang>/`; code dùng chung đặt trong `src/shared/`.
- Code của một chức năng chỉ được nằm trong thư mục feature của nó; muốn dùng chung thì đưa lên shared, cấm import chéo trực tiếp giữa hai feature.
- Component: PascalCase; hook: `useXxx`; hàm/biến: camelCase; schema Zod: `xxxSchema`.
- File route/component: kebab-case; file thư viện: camelCase; SQL: snake_case.
- Bảng/cột Postgres và bucket/path Storage dùng snake_case.
- API theo feature phải là hàm cụ thể: `signUp`, `signIn`, `signOut`, `requestPasswordReset`, `updatePassword`, `getProfile`, `updateProfile`, `listNotes`, `createNote`, `updateNote`, `deleteNote`, `uploadAvatar`.
- Không dùng `any`; mọi lỗi từ API phải được chuẩn hóa trước khi hiển thị.

## Điều cấm

- Không thêm chức năng ngoài FR-01..FR-45 đã chốt; không social login, role/admin, chat ngoài tài liệu, môn học, điểm, lịch học.
- Không dùng service-role key trong app; không commit secret; không tắt RLS.
- Không chỉ filter `user_id` ở client để bảo vệ dữ liệu; RLS là bắt buộc.
- Không gọi Supabase trực tiếp từ screen; screen gọi API/query của feature.
- Không tự thay stack, package hoặc kiến trúc đã chốt trong docs.
- Không force-push, rebase branch chia sẻ hay sửa lịch sử nếu chưa được chủ dự án yêu cầu. Không tự merge vào `main` ở G1–G3; từ G4 trở đi agent tự merge sau khi cổng chất lượng xanh theo quyết định của chủ dự án (xem Quy tắc Git).

## Quy trình G1 → G5

1. Trước task: đọc `docs/TASKS.md`, tài liệu được trỏ tới và acceptance criteria liên quan.
2. Chỉ làm đúng một checkbox; cập nhật traceability/test nếu task làm thay đổi phạm vi kiểm thử.
3. Chạy type check, lint và test tay tối thiểu cho phần vừa làm.
4. Cập nhật `docs/DEVLOG.md`, commit và push ngay theo Quy tắc Git.
5. Hết giai đoạn G1–G3: push branch, mở PR rồi dừng chờ review; chỉ tag sau khi chủ dự án merge. Từ G4 trở đi: agent tự merge branch vào `main` sau khi cổng chất lượng xanh (`npx tsc --noEmit`, `npm run lint`, `npm test`), tự tạo tag `gx-done` và push — theo quyết định của chủ dự án ngày 2026-09-18, không mở PR chờ review.

## Khi làm X thì đọc file Y

- Xác định yêu cầu/acceptance/out of scope → `docs/SPEC.md`.
- Tạo route, provider, feature hoặc quyết định luồng dữ liệu → `docs/ARCHITECTURE.md`.
- Viết migration, trigger, RLS hoặc Storage policy → `docs/DATA-MODEL.md`.
- Làm màn hình, điều hướng, auth guard, trạng thái UI → `docs/UI-FLOW.md`.
- Chọn task/giai đoạn/branch/tag → `docs/TASKS.md`.
- Kết thúc giai đoạn hoặc ghi quyết định → `docs/DEVLOG.md`.
- Đối chiếu FR với file/hàm/test → `docs/FR-TRACEABILITY.md`.
- Dựng môi trường hoặc cấu hình Supabase Dashboard → `docs/SETUP.md`.
- Kiểm thử tay, lỗi mạng, token hoặc reset link → `docs/TEST-CHECKLIST.md`.
- Chuẩn bị báo cáo/vấn đáp → `docs/REPORT-NOTES.md`.
- Tạo branch/commit/PR/tag/hoàn tác → `docs/GIT-WORKFLOW.md`.

## Quy tắc Git (BẮT BUỘC)

### Nguyên tắc

- Commit sau MỖI task hoàn thành trong docs/TASKS.md, không dồn cuối giai đoạn.
- Mỗi commit phải để lại project ở trạng thái CHẠY ĐƯỢC (app mở không crash).
  Task quá lớn thì tách nhỏ trong TASKS.md rồi commit từng phần.
- Push ngay sau mỗi commit. Không giữ commit ở local.
- Trước khi commit: chạy `npx tsc --noEmit`, `npm run lint` và `npm test`.
  Có lỗi thì sửa trước, không commit code lỗi type/test đỏ.

### Branch

- `main` chỉ nhận code đã review (G1–G3) hoặc đã qua cổng chất lượng xanh do agent tự kiểm (G4 trở đi). Không commit trực tiếp lên main.
- Mỗi giai đoạn một branch: feat/g1-setup, feat/g2-database, feat/g3-auth-core,
  feat/g4-password-reset, feat/g5-profile-docs.
- Hết giai đoạn G1–G3: push branch, tạo PR kèm mô tả (đã làm gì, test thế nào, FR nào
  được thoả), DỪNG chờ tôi review. KHÔNG tự merge.
- Từ G4 trở đi (quyết định của chủ dự án ngày 2026-09-18): agent tự merge branch vào
  `main` sau khi `npx tsc --noEmit`, `npm run lint`, `npm test` đều xanh, rồi tự tạo
  tag `gx-done` và push (`git push origin main gx-done`). Không mở PR chờ review.
- Sau khi merge (tự merge hoặc chủ dự án merge): ghi full commit hash, branch, tag vào `docs/DEVLOG.md`.

### Commit message (Conventional Commits, mô tả tiếng Việt)

<type>(<scope>): <mô tả ngắn>

[thân: vì sao làm vậy, nếu không hiển nhiên]

Refs: FR-0X

type: feat | fix | refactor | chore | docs | test | style

scope: auth | profile | db | ui | config | docs

### An toàn

- TUYỆT ĐỐI không commit .env hay bất kỳ key/secret. Chỉ commit .env.example
  với giá trị rỗng.
- Trước mỗi commit, tự soát `git diff --cached` tìm chuỗi trông như
  key/token/password. Có thì dừng và báo tôi.
- Nếu phát hiện đã commit secret ở commit trước: DỪNG NGAY, báo tôi, không tự
  chạy filter-branch hay force push. Key đó coi như đã lộ, phải rotate.

### Khi có sự cố

- Không `push --force` lên branch đã push, không `reset --hard` khi có thay đổi
  chưa commit, không `rebase` branch đã chia sẻ. Muốn làm thì hỏi tôi.
- Hoàn tác commit đã push: dùng `git revert`, giữ lịch sử.
- Hết mỗi giai đoạn ghi vào DEVLOG.md: hash commit cuối, branch, tag.
