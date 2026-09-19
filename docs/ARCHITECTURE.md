# Kiến trúc — AI Learning Assistant

## Mục tiêu thiết kế

Kiến trúc theo feature, ít tầng và đủ rõ để sinh viên giải thích. App chạy bằng Expo Go, không dùng development build. `app/` chỉ điều phối route/UI; mọi lời gọi Supabase nằm trong `src/features/*/api.ts`. React Query quản lý server state, React Hook Form + Zod quản lý form, RLS là ranh giới bảo mật cuối cùng.

## Cây thư mục đích

```text
.
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   ├── forgot-password.tsx
│   │   ├── verify-reset-otp.tsx
│   │   └── reset-password.tsx
│   └── (app)/
│       ├── _layout.tsx
│       ├── dashboard.tsx (màn chính sau đăng nhập: 6 thẻ chức năng)
│       ├── profile/
│       │   ├── index.tsx
│       │   └── change-password.tsx
│       └── notes/
│           ├── index.tsx
│           ├── new.tsx
│           └── [id].tsx
├── src/
│   ├── shared/
│   │   ├── components/
│   │   │   ├── ScreenContainer.tsx
│   │   │   ├── FormTextInput.tsx
│   │   │   ├── PasswordInput.tsx
│   │   │   ├── FeedbackSnackbar.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── LoadingState.tsx
│   │   ├── theme/
│   │   │   ├── theme.ts
│   │   │   ├── spacing.ts
│   │   │   └── index.ts
│   │   ├── lib/{env.ts,supabase.ts,queryClient.ts}
│   │   ├── providers/AppProviders.tsx (PaperProvider + settings.icon cầu nối
│   │   │   sang MaterialCommunityIcons của @expo/vector-icons + StatusBar theo theme)
│   │   ├── test-utils/vectorIconsMock.tsx (stub icon đồng bộ, chỉ dùng trong Jest)
│   │   └── types/database.ts
│   ├── features/
│   │   ├── auth/{api.ts,schemas.ts,errors.ts,recovery.ts,recoveryStorage.ts,useSession.ts}
│   │   ├── auth/__tests__/
│   │   ├── profile/{api.ts,schemas.ts,queries.ts,errors.ts,avatar.ts,pickAvatar.ts,ProfileView.tsx}
│   │   ├── profile/__tests__/
│   │   ├── notes/{api.ts,schemas.ts,queries.ts,errors.ts}
│   │   ├── documents/.gitkeep (FR-06 → FR-13, chưa code)
│   │   ├── summary/.gitkeep (FR-14 → FR-22, chưa code)
│   │   ├── chat/.gitkeep (FR-23 → FR-30, chưa code)
│   │   ├── scan/.gitkeep (FR-31 → FR-37, chưa code)
│   │   └── solver/.gitkeep (FR-38 → FR-45, chưa code)
├── supabase/migrations/
│   └── 0001_account_manager.sql
├── scripts/
│   ├── rls-proof.ts (FR-05, chạy tay với credential .env.local)
│   └── storage-rls-proof.ts (FR-04, tương tự)
├── docs/
├── .env.example
├── app.json
├── eslint.config.js
├── package.json
└── tsconfig.json
```

Không tạo thư mục/file trong cây này trước task tương ứng. `database.ts` được sinh từ schema Supabase sau migration, không viết type thủ công nếu CLI sinh type đã được cấu hình.

## Luồng dữ liệu

```text
Screen → React Hook Form + Zod → feature api.ts → Supabase JS
                                                   ├─ Auth
                                                   ├─ Postgres + RLS
                                                   └─ Storage + policy
Supabase response → React Query cache → trạng thái loading/error/data → Screen
Auth event → useSession → route guard trong layout → (auth) hoặc (app)
```

- Mutation thành công invalidate query key cụ thể: `['profile', userId]` hoặc `['notes', userId]`.
- Session là auth state, không đưa vào React Query; `useSession` đăng ký đúng một `onAuthStateChange` và cleanup subscription.
- Route guard chờ khôi phục session xong mới redirect để tránh nháy màn hình.
- Reset password dùng email + OTP 6 số: `resetPasswordForEmail` gửi mã, `verifyOtp({ email, token, type: 'recovery' })` tạo recovery session, rồi `updateUser` đổi mật khẩu. Deep link không nằm trên critical path.
- Lỗi mạng/API được `api.ts` ném lên; screen chuyển thành thông báo tiếng Việt, không lộ chi tiết bảo mật.

## Cách 6 chức năng cùng tồn tại trong một app

- Một route group `(app)` duy nhất sau đăng nhập; `dashboard.tsx` là màn chính
  liệt kê 6 thẻ. Mỗi chức năng tương lai là một cặp song song: thư mục
  `src/features/<ten>/` + route riêng dưới `(app)/`, không chạm code Chức năng 1.
- `src/shared/` là nơi duy nhất chứa code dùng chung (theme, component,
  supabase client, providers). Cấm import chéo trực tiếp giữa hai thư mục
  feature; cần dùng chung thì đưa lên `shared`.
- Session, theme và providers giữ một instance ở root nên mọi chức năng dùng
  chung Auth mà không cần login lại.

## Luồng màn hình

### Sơ đồ điều hướng

```text
Khởi động `/`
├─ đang khôi phục session → splash/loading
├─ chưa login → `/sign-in`
│  ├─ `/sign-up` → vào app khi dev / xác nhận email khi demo
│  └─ `/forgot-password` → email → `/verify-reset-otp` → `/reset-password`
└─ đã login → `/dashboard` (màn chính: 6 thẻ chức năng)
   ├─ thẻ Chức năng 1 → `/notes`
   │  ├─ `/notes/new` → tạo → `/notes`
   │  ├─ `/notes/[id]` → sửa/xóa → `/notes`
   │  └─ `/profile` → cập nhật / đăng xuất → `/sign-in`
   └─ thẻ Chức năng 2 → 6: "Sắp có", bị vô hiệu hóa, không điều hướng
```

Route group `(auth)` và `(app)` không xuất hiện trong URL. Layout mỗi group thực hiện guard; redirect chỉ sau khi `useSession` hoàn tất loading.

### Màn hình và trạng thái (G6)

Mọi màn hình dùng `ScreenContainer` (SafeArea + KeyboardAvoidingView +
ScrollView theo token `src/shared/theme`); tiêu đề `headlineSmall`, phụ đề
`bodyMedium`; không dùng `<Text>` trần cho tiêu đề. Nút submit chính
`mode="contained"` có icon, `loading` + `disabled` khi đang gửi; link phụ
`mode="text"`.

### Quy ước header (G6.1)

- Header duy nhất là Paper `Appbar`; **toàn bộ Stack để
  `headerShown: false`** (root, `(app)`, `(auth)`) kèm `contentStyle` nền
  theo theme để hết dải trắng/flash trắng khi chuyển màn.
- Navigation theme (`ThemeProvider` từ `expo-router`) suy ra từ theme MD3
  G6 qua `adaptNavigationTheme` (`src/shared/theme/navigation.ts`) — một nguồn
  theme duy nhất, gọi ở module scope, không gọi trong render.
- Màn con trong `(app)` (profile, đổi mật khẩu, tạo/sửa note) dùng
  `ScreenHeader` qua prop `header` của `ScreenContainer` (trong SafeArea,
  ngoài ScrollView): `Appbar.BackAction` (label “Quay lại”) chỉ render khi
  `router.canGoBack()`, `Appbar.Content` title tiếng Việt (“Thông tin cá
  nhân”, “Đổi mật khẩu”, “Ghi chú mới”, “Sửa ghi chú”). Màn Notes và
  Dashboard giữ `Appbar` sẵn có làm header duy nhất.
- `StatusBar` đặt một chỗ duy nhất ở root provider theo theme
  (sáng chữ tối / tối chữ sáng).

| Route | Mục đích | Component chính | Loading / empty / error / success |
|---|---|---|---|
| `/` | Chọn nhánh theo session | `LoadingState` | Loading khi khôi phục session; lỗi cấu hình hiển thị rõ; thành công redirect |
| `/dashboard` | Màn chính sau login: 6 thẻ CN | `Card` + `Chip` (testID `dashboard-card-<id>`) | Không loading (không fetch); thẻ CN1 bấm tới `/notes`; thẻ CN2–6 "Sắp có", disabled |
| `/sign-in` | FR-02 đăng nhập | `FormTextInput` (email `email-outline`), `PasswordInput`, `Button` icon `login` (testID `login-submit`), link đăng ký/quên mật khẩu | Button spinner; không có empty; lỗi field/API; thành công về `/dashboard` |
| `/sign-up` | FR-01 đăng ký | Full name (`account`)/student code (`badge-account-horizontal-outline`)/email (`email-outline`) + 2 `PasswordInput` (testID `password-toggle`, `password-confirm-toggle`), nút icon `account-plus` (testID `register-submit`) | Spinner; lỗi Zod/email hoặc student code trùng; dev vào app ngay, demo yêu cầu kiểm tra email theo env |
| `/forgot-password` | FR-03 gửi email reset | Email form icon `email-outline`, nút icon `send` (testID `forgot-submit`) | Spinner; luôn dùng thông báo success trung tính; offline cho retry |
| `/verify-reset-otp` | FR-03 xác minh mã | Ô OTP icon `numeric`, căn giữa + letterSpacing rộng (testID `otp-input`), nút Xác minh icon `check` (testID `otp-submit`), nút gửi lại icon `refresh` (testID `otp-resend`) | Spinner; OTP sai/hết hạn báo lỗi; success tạo recovery session rồi sang reset |
| `/reset-password` | FR-03 đặt mật khẩu mới | 2 `PasswordInput` + độ mạnh mật khẩu, nút icon `check` (testID `reset-submit`) | Thiếu recovery session thì về verify OTP; thành công về sign-in |
| `/notes` | FR-05 danh sách riêng | `Appbar` (action `account-circle`), `List.Item` icon `note-text-outline` + `Divider`, `FAB` icon `plus` (testID `notes-fab`), `EmptyState` icon `notebook-outline` | `ListSkeleton` khi tải; empty có CTA “Tạo ghi chú”; lỗi có Retry; pull-to-refresh nối vào `refetch`; success danh sách theo `updated_at desc` |
| `/notes/new` | FR-05 tạo note | Title (`format-title`)/content (`text`) form, nút icon `content-save` (testID `note-save`) | Spinner khi lưu; lỗi validation/API; success invalidate `notes` rồi back |
| `/notes/[id]` | FR-05 sửa/xóa note | Form, nút Lưu icon `content-save` (testID `note-update`), nút Xóa icon `trash-can-outline` màu error, confirm dialog | Loading fetch; không tìm thấy/không có quyền dùng cùng thông báo; lỗi retry; success back |
| `/profile` | FR-04 xem/sửa hồ sơ, avatar, logout | `ProfileView` (thuần hiển thị) + container query/mutation; avatar bọc `Pressable` overlay icon `camera` (testID `avatar-picker`, label “Đổi ảnh đại diện”); nút Lưu icon `content-save` (testID `profile-save`); link đổi mật khẩu icon `lock-reset`; nút đăng xuất icon `logout` màu error; `FeedbackSnackbar` thay Alert | Profile loading → spinner “Đang tải hồ sơ…”; query lỗi → `EmptyState` “Không tải được hồ sơ.” + nút “Thử lại” (testID `profile-retry`, gọi refetch); ready → form + avatar; lưu/upload pending → disable + spinner trên nút; success/error báo bằng Snackbar (không Alert), xem chi tiết luồng avatar bên dưới |
| `/profile/change-password` | FR-03 đổi pass khi đã login | 3 `PasswordInput`, nút icon `lock-reset` (testID `change-password-submit`) | Spinner; sai pass hiện tại/trùng pass cũ báo riêng; success banner + về hồ sơ |

### Bảng icon (G6, MaterialCommunityIcons qua settings.icon)

Mọi tên dưới đây đã đối chiếu glyphmap thật của `@expo/vector-icons`;
tên sai Paper sẽ render rỗng im lặng nên không tự ý đổi tên.

| Icon | Dùng ở đâu |
|---|---|
| `login` | Nút Đăng nhập |
| `account-plus` | Nút Đăng ký |
| `account` | Ô họ tên, nút “Về hồ sơ” |
| `badge-account-horizontal-outline` | Ô mã sinh viên |
| `email-outline` | Ô email mọi form auth |
| `lock-outline` | Ô mật khẩu (`PasswordInput` left icon) |
| `eye` / `eye-off` | Toggle hiện/ẩn mật khẩu |
| `send` | Nút Gửi mã OTP |
| `numeric` | Ô OTP + nút “Nhập mã OTP” |
| `check` | Nút Xác minh OTP, nút Đặt lại mật khẩu |
| `refresh` | Nút Gửi lại mã OTP |
| `lock-reset` | Nút Đổi mật khẩu (form + link ở profile) |
| `check-circle` | Banner thành công, Snackbar success |
| `alert-circle` | Banner/Snackbar lỗi, empty lỗi |
| `information` | Snackbar info |
| `close` | Nút đóng Snackbar |
| `email-check` | Banner đã gửi email |
| `history` | Banner khôi phục email giữa luồng |
| `camera` | Overlay đổi avatar |
| `account-circle` | Appbar mở hồ sơ, thẻ CN1 trên dashboard |
| `content-save` | Nút Lưu (profile, tạo/sửa note) |
| `logout` | Nút Đăng xuất (màu error) |
| `plus` | FAB thêm ghi chú |
| `note-text-outline` | Icon mỗi dòng ghi chú |
| `notebook-outline` | Empty danh sách notes |
| `format-title` / `text` | Ô tiêu đề / nội dung note |
| `trash-can-outline` | Nút Xóa ghi chú (màu error) |
| `theme-light-dark` | Chủ đề “Hệ thống” (toggle + SegmentedButtons) |
| `weather-sunny` | Chủ đề “Sáng” (toggle + SegmentedButtons) |
| `weather-night` | Chủ đề “Tối” (toggle + SegmentedButtons) |
| `file-document-outline` | Thẻ CN2 trên dashboard |
| `text-box-outline` | Thẻ CN3 trên dashboard |
| `message-text-outline` | Thẻ CN4 trên dashboard |
| `lightbulb-outline` | Thẻ CN6 trên dashboard |
| `clock-outline` | Chip “Sắp có” trên dashboard |

Mọi control chỉ có icon đều có `accessibilityLabel` và vùng bấm tối thiểu
44x44 (avatar `Pressable` dùng `hitSlop` + `minHeight/minWidth`).

### Chủ đề giao diện (G7)

Ba mode (`ThemeMode` trong `src/shared/theme/themeMode.ts`): `light`, `dark`,
`system`. `effectiveScheme = mode === 'system' ? (useColorScheme() ?? 'light') : mode`.
Lựa chọn lưu ở AsyncStorage key `app.theme.mode`, đọc ra validate bằng
type guard — giá trị rác → fallback `system`, không throw.

Hai điểm truy cập đọc/ghi cùng một state (`ThemeModeProvider` ở root,
bọc ngoài PaperProvider và ThemeProvider navigation):

- Nút nhanh `Appbar.Action` (testID `theme-toggle`) trên Notes và Profile:
  bấm cycle `system → light → dark → system`; icon và
  `accessibilityLabel` tiếng Việt đổi động theo mode.
- `Card` “Giao diện” trong Profile: Paper `SegmentedButtons` (testID
  `theme-segmented`) 3 giá trị Sáng / Tối / Hệ thống.

| Mode | Icon toggle + segmented | Nhãn accessibility toggle |
|---|---|---|
| `system` | `theme-light-dark` | “Chủ đề: Theo hệ thống. Chạm để đổi chủ đề” |
| `light` | `weather-sunny` | “Chủ đề: Sáng. Chạm để đổi chủ đề” |
| `dark` | `weather-night` | “Chủ đề: Tối. Chạm để đổi chủ đề” |

Chống flash: khi chưa đọc xong storage (`isThemeHydrated === false`)
app render `null` — splash hệ thống vẫn hiển thị (provider bọc ngoài
`AuthProvider`, nơi gọi `hideAsync`) nên không nháy sáng→tối.
`StatusBar` giữ một chỗ duy nhất ở root provider, đổi theo theme hiệu lực.

### Luồng đổi avatar (`/profile`, FR-04)

```text
Chạm avatar (Pressable overlay icon camera, label “Đổi ảnh đại diện”)
→ xin quyền thư viện (từ chối → Snackbar + nút “Mở Cài đặt”)
→ picker (images, crop 1:1) → hủy → im lặng, giữ avatar cũ
→ kiểm tra MIME khai báo → resize cạnh dài ≤ 512px, JPEG ~0.7, lấy base64
→ guard > 2MB → chặn bằng Snackbar, giữ file cũ
→ upload ArrayBuffer lên <uid>/avatar_<timestamp>.jpg (image/jpeg)
→ update profiles.avatar_path → invalidate ['profile', userId]
→ xóa object cũ best-effort (lỗi xóa chỉ warn, không fail)
→ Snackbar “Đã đổi avatar.”
```

- Xem: `full_name`, `student_code`, email (từ auth), avatar qua signed URL
  TTL 3600s (cache 55 phút). Chưa có `avatar_path` hoặc signed URL lỗi →
  fallback `Avatar.Text` chữ cái đầu (`full_name`, rồi email, rồi `?`).
- Sửa: form RHF + `profileSchema` (giữ luật G3/DB), lỗi field nằm dưới ô nhập;
  nút Lưu loading/disabled khi đang lưu, giữ form khi lỗi mạng để thử lại.
- Vị trí Snackbar lỗi (đều trong màn `/profile`, không Alert thô):
  - Lưu hồ sơ lỗi → Snackbar (mã trùng đúng hoa/thường → “Mã sinh viên này
    đã được sử dụng.” nhờ map 23505; offline → câu báo mạng + thử lại).
  - Upload/signed URL lỗi → Snackbar; từ chối quyền ảnh → Snackbar kèm action
    “Mở Cài đặt”; đăng xuất lỗi → Snackbar.

### Hành vi theo trạng thái xác thực

- Chưa login truy cập route `(app)`: `replace('/sign-in')`, không để Back quay vào dữ liệu cũ.
- Đã login truy cập route `(auth)` trừ luồng recovery hợp lệ: `replace('/dashboard')`.
- Recovery session chỉ được tạo sau `verifyOtp` thành công; không phụ thuộc deep link.
- Khi logout hoặc token refresh thất bại: xóa cache React Query chứa dữ liệu user, đóng route riêng tư và về `/sign-in`.
- Khi app quay lại foreground: Supabase tiếp tục auto-refresh token; UI giữ loading ngắn trong lúc xác định session.

### Quy tắc form và phản hồi

- Validate khi submit, lỗi nằm ngay dưới field; password không log/giữ ngoài form.
- Chặn submit lặp trong mutation; giữ dữ liệu form khi lỗi mạng để người dùng thử lại.
- Delete note bắt buộc confirm; chỉ đóng màn hình sau khi server xác nhận.
- Mọi màn hình có keyboard avoidance và label accessibility cơ bản.
- Thông báo đăng ký/quên mật khẩu không tiết lộ email đã tồn tại nếu Supabase cấu hình trả phản hồi trung tính; test vẫn xác nhận không tạo duplicate.

## Lý do chọn công nghệ
- **Expo SDK 57 + TypeScript strict:** một codebase React Native, vòng lặp phát triển nhanh và lỗi kiểu được phát hiện sớm.
- **expo-router:** route dựa trên file; nhóm `(auth)` và `(app)` biểu diễn trực tiếp trạng thái truy cập.
- **Supabase Auth/Postgres/Storage:** cùng một nền tảng cho danh tính, dữ liệu quan hệ, avatar và policy dựa trên `auth.uid()`; phù hợp demo RLS.
- **supabase-js v2 + AsyncStorage:** SDK chính thức để gọi Auth/Data/Storage; AsyncStorage duy trì session trên React Native.
- **React Hook Form + Zod:** giảm state form thủ công, schema dùng chung cho validate và thông báo lỗi.
- **TanStack Query:** cache/invalidate dữ liệu server, biểu diễn loading/error rõ ràng; không dùng cho form/session.
- **React Native Paper + @expo/vector-icons:** bộ component nhất quán; icon
  resolve qua `settings.icon` sang MaterialCommunityIcons để hiện đủ trên
  Expo Go (Paper mặc định cần react-native-vector-icons vốn không có sẵn).
  Token mở rộng ở `src/theme` (spacing/radius/màu success, sáng/tối theo hệ
  điều hành), không custom font; typography dùng variant sẵn của Paper.

## Biến môi trường

Chỉ dùng hai biến public cần thiết cho client:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
EXPO_PUBLIC_REQUIRE_EMAIL_CONFIRMATION=false
```

- Commit `.env.example` với giá trị rỗng; `.env` và `.env.local` bị ignore.
- `src/lib/env.ts` đọc và kiểm tra ba biến ngay khi khởi tạo; thiếu/sai biến thì báo tên biến, không in giá trị.
- Cờ email confirmation chỉ điều khiển hành vi/thông báo của app; cấu hình thật vẫn phải tắt khi dev và bật khi demo trên Supabase Dashboard.
- Publishable/anon key được thiết kế để có mặt ở client nhưng **không phải** cơ chế phân quyền; RLS bảo vệ dữ liệu.
- Tuyệt đối không đưa `service_role`, database password, access token hoặc refresh token vào source/env client.
- Sau khi đổi env, khởi động lại Expo; không ghi key vào screenshot, DEVLOG hay báo cáo.
