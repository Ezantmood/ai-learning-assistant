# AGENTS.md

## Phạm vi và mục tiêu

- Dự án độc lập **Student Account Manager**, hoàn thành trong 5 ngày.
- Chỉ làm quản lý tài khoản sinh viên và bảng minh chứng `study_notes`.
- Không tạo module, bảng, route hay abstraction dự phòng cho chức năng tương lai.
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

- Route chỉ đặt trong `app/`; nghiệp vụ theo feature đặt trong `src/features/`.
- Component: PascalCase; hook: `useXxx`; hàm/biến: camelCase; schema Zod: `xxxSchema`.
- File route/component: kebab-case; file thư viện: camelCase; SQL: snake_case.
- Bảng/cột Postgres và bucket/path Storage dùng snake_case.
- API theo feature phải là hàm cụ thể: `signUp`, `signIn`, `signOut`, `requestPasswordReset`, `updatePassword`, `getProfile`, `updateProfile`, `listNotes`, `createNote`, `updateNote`, `deleteNote`, `uploadAvatar`.
- Không dùng `any`; mọi lỗi từ API phải được chuẩn hóa trước khi hiển thị.

## Điều cấm

- Không thêm chức năng ngoài FR-01..FR-05; không social login, role/admin, chat, môn học, điểm, lịch học.
- Không dùng service-role key trong app; không commit secret; không tắt RLS.
- Không chỉ filter `user_id` ở client để bảo vệ dữ liệu; RLS là bắt buộc.
- Không gọi Supabase trực tiếp từ screen; screen gọi API/query của feature.
- Không tự thay stack, package hoặc kiến trúc đã chốt trong docs.
- Không merge PR, force-push, rebase branch chia sẻ hay sửa lịch sử nếu chưa được chủ dự án yêu cầu.

## Quy trình G1 → G5

1. Trước task: đọc `docs/TASKS.md`, tài liệu được trỏ tới và acceptance criteria liên quan.
2. Chỉ làm đúng một checkbox; cập nhật traceability/test nếu task làm thay đổi phạm vi kiểm thử.
3. Chạy type check, lint và test tay tối thiểu cho phần vừa làm.
4. Cập nhật `docs/DEVLOG.md`, commit và push ngay theo Quy tắc Git.
5. Hết giai đoạn: push branch, mở PR rồi dừng chờ review; chỉ tag sau khi chủ dự án merge.

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
- Trước khi commit: chạy `npx tsc --noEmit` và `npm run lint`. Có lỗi thì sửa
  trước, không commit code lỗi type.

### Branch

- `main` chỉ nhận code đã review. Không commit trực tiếp lên main.
- Mỗi giai đoạn một branch: feat/g1-setup, feat/g2-database, feat/g3-auth-core,
  feat/g4-password-reset, feat/g5-profile-docs.
- Hết giai đoạn: push branch, tạo PR kèm mô tả (đã làm gì, test thế nào, FR nào
  được thoả), DỪNG chờ tôi review. KHÔNG tự merge.
- Sau khi tôi merge: `git tag g2-done && git push --tags`.

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
