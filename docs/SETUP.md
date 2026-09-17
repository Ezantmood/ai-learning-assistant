# Dựng dự án từ số 0

Đây là checklist cho G1/G2, **không thực hiện trong session khởi tạo tài liệu**. Dừng ngay nếu package được nêu bị deprecated hoặc Expo báo không tương thích SDK 57; báo chủ dự án, không tự thay package.

## 1. Điều kiện máy

- Node.js tối thiểu `22.13.x` theo Expo SDK 57; Git; Expo Go tương thích SDK 57. Không tạo development build.
- Một tài khoản GitHub và một tài khoản Supabase.
- Kiểm tra: `node --version`, `npm --version`, `git --version`.

## 2. Tạo Expo SDK 57

1. Đang ở thư mục project chỉ có docs/Git, đọc lại hướng dẫn SDK 57 chính thức.
2. Tạo app bằng template SDK 57 vào thư mục tạm, rồi chuyển các file template cần thiết vào root mà không ghi đè docs/Git. Lệnh tham chiếu: `npx create-expo-app@latest <thu-muc-tam> --template default@sdk-57`.
3. Xác nhận `package.json` dùng `expo` dòng `~57.x`, TypeScript strict và entry/router đúng template.
4. Xóa thư mục tạm sau khi đã kiểm tra diff; không sinh `ios/`/`android/`.

## 3. Cài dependency

Chỉ sau khi kiểm tra trạng thái deprecated/peer compatibility của từng package:

```bash
npx expo install expo-router @supabase/supabase-js@^2 @react-native-async-storage/async-storage react-hook-form zod @tanstack/react-query react-native-paper
```

Nếu hướng dẫn Supabase React Native cho SDK 57 yêu cầu polyfill bổ sung, ghi rõ lý do và xin chủ dự án duyệt trước khi thêm. Không dùng `npm install` cho danh sách trên. Sau cài chạy `npx expo install --check`, type check và lint.

## 4. Tạo Supabase project bằng Dashboard (làm tay)

1. New project → chọn organization → đặt tên `student-account-manager` → tạo database password mạnh và cất ngoài repo.
2. Chọn region gần người dùng; chờ project sẵn sàng.
3. Project Settings/Connect/API → lấy Project URL và **Publishable key** (hoặc anon key nếu Dashboard dự án chỉ cung cấp tên cũ). Không lấy `service_role`.
4. Authentication → Providers → Email: bật email/password; **tắt Confirm email khi dev**, bật lại khi demo.
5. Authentication → Email Templates → Reset Password: thay nội dung đường link bằng mã `{{ .Token }}` để email hiển thị OTP 6 số; không chèn secret.
6. SQL Editor: đọc toàn bộ `supabase/migrations/0001_account_manager.sql`, chạy trên project; không chạy từng đoạn thiếu policy.
7. Table Editor: xác nhận `profiles`, `study_notes` có RLS enabled.
8. Storage: xác nhận bucket private `avatars`, MIME/size limit và bốn policy đúng `DATA-MODEL.md` (migration nên tạo các mục này).
9. Tạo hai tài khoản test A/B không dùng dữ liệu thật để test cách ly.

## 5. Cấu hình local

1. Copy `.env.example` thành `.env`.
2. Điền `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` và `EXPO_PUBLIC_REQUIRE_EMAIL_CONFIRMATION=false` khi dev.
3. Không dùng database password/service-role key trong app.
4. Chạy `npx tsc --noEmit`, `npm run lint`, rồi `npx expo start`.

## 6. Xác minh ban đầu

- App mở không crash khi env hợp lệ; thiếu env phải báo cấu hình rõ ràng.
- Restart app khôi phục session bằng AsyncStorage.
- A/B không truy cập chéo profile, note và avatar theo checklist.
- Nguồn tham chiếu: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), [Expo Router](https://docs.expo.dev/versions/latest/sdk/router/), [Supabase Auth React Native](https://supabase.com/docs/guides/auth/quickstarts/react-native).
