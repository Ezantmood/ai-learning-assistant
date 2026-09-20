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
│   │   ├── documents/{api.ts,storage.ts,schemas.ts,queries.ts,errors.ts} (CN2, FR-06 → FR-13)
│   │   ├── documents/__tests__/
│   │   ├── summary/.gitkeep (FR-14 → FR-22, chưa code)
│   │   ├── chat/.gitkeep (FR-23 → FR-30, chưa code)
│   │   ├── scan/.gitkeep (FR-31 → FR-37, chưa code)
│   │   └── solver/.gitkeep (FR-38 → FR-45, chưa code)
├── supabase/migrations/
│   └── 0001_account_manager.sql
├── supabase/functions/
│   └── gemini-proxy/index.ts (mũi thăm dò CN3-01: JWT → secret → Gemini 2.5
│       Flash prompt cố định; CHƯA deploy được — xem REPORT-NOTES + SETUP 5d)
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

### Sơ đồ điều hướng (vỏ app-shell: tabs + lối lùi)

```text
Khởi động `/` (decideRouteTarget trong src/shared/lib/navigation.ts)
├─ loading → splash/loading (chống nháy lúc hydrate session + cờ recovery)
├─ recovery → `/reset-password` (mở lại app giữa luồng OTP thì làm tiếp)
├─ auth → `/sign-in` [Stack (auth)]
│  ├─ `/sign-up` (push, back về sign-in)
│  └─ `/forgot-password` → (push) `/verify-reset-otp` → (push) `/reset-password`
└─ app → tab Trang chủ `/dashboard` [Tabs (app): Trang chủ/Tài liệu/Tài khoản]
   ├─ tab Trang chủ `/dashboard`: lưới 6 thẻ CN
   │  ├─ CN1 → (push) `/notes` → `/notes/new`, `/notes/[id]`
   │  ├─ CN2 → tab Tài liệu (chuyển tab, giữ lịch sử để back)
   │  └─ CN3→CN6 "Sắp có", bấm báo "đang phát triển" (chỗ cắm CN sau)
   ├─ tab Tài liệu `/documents` (+ `/documents/upload`, `/documents/[id]`,
   │  `/subjects` push đè lên, back về tab, tab bar ẩn ở màn con)
   └─ tab Tài khoản `/profile` (CN1 nằm trong tab này: nút “Ghi chú học tập”
      push `/notes`; `/profile/change-password` push; đăng xuất replace về
      `/sign-in`)
```

Quy tắc (nguyên nhân gốc: `(app)` từng là Stack phẳng quanh `/notes`,
đăng nhập `replace` xóa lịch sử mà màn gốc CN1 không có back nên kẹt):

- Vào màn con dùng `router.push`, KHÔNG `replace`. Chỉ `replace` ở biên
  `(auth)` ↔ `(app)` (đăng nhập/đăng xuất) và khi thoát wizard sau khi xong việc.
- Mọi màn không phải gốc tab đều có `Appbar.BackAction`; gốc tab
  (Trang chủ, Tài liệu, Tài khoản) không có back — tab bar là lối thoát.
- `onPress` của BackAction: `goBackOrReplace(router, fallback)` —
  `canGoBack()` thì `back()`, ngược lại `replace` về gốc tab tương ứng
  (hết lịch sử do deep link/restart). Nút Back cứng Android ăn cùng lịch
  sử stack nên cũng đúng theo.
- Route group `(auth)` và `(app)` không xuất hiện trong URL. Layout mỗi group
  thực hiện guard; redirect chỉ sau khi `useSession` hoàn tất loading.

### Màn hình và trạng thái (G6)

Mọi màn hình dùng `ScreenContainer` (SafeArea + KeyboardAvoidingView +
ScrollView theo token `src/shared/theme`); tiêu đề `headlineSmall`, phụ đề
`bodyMedium`; không dùng `<Text>` trần cho tiêu đề. Nút submit chính
`mode="contained"` có icon, `loading` + `disabled` khi đang gửi; link phụ
`mode="text"`.

### Quy ước header (G6.1)

- Header duy nhất là Paper `Appbar`; **toàn bộ navigator để
  `headerShown: false`** (root Stack, `(app)` Tabs, `(auth)` Stack) kèm
  `contentStyle` nền theo theme để hết dải trắng/flash trắng khi chuyển màn.
  Tab bar `(app)` ăn `theme.colors` (primary/onSurfaceVariant/surface) nên
  đúng cả light lẫn dark; icon tab là MaterialCommunityIcons đã đối chiếu
  (`home`, `file-document-outline`, `account`).
- Navigation theme (`ThemeProvider` từ `expo-router`) suy ra từ theme MD3
  G6 qua `adaptNavigationTheme` (`src/shared/theme/navigation.ts`) — một nguồn
  theme duy nhất, gọi ở module scope, không gọi trong render.
- Màn con (ghi chú tạo/sửa, tài liệu upload/chi tiết, môn học, đổi mật khẩu,
  các màn `(auth)` trừ sign-in) dùng `ScreenHeader` qua prop `header` của
  `ScreenContainer` (trong SafeArea, ngoài ScrollView): `Appbar.BackAction`
  (label “Quay lại”) LUÔN render (không còn điều kiện `canGoBack`), `onPress`
  gọi `goBackOrReplace(router, fallback)` — hết lịch sử thì về gốc tab chứ
  không kẹt. `Appbar.Content` title tiếng Việt (“Thông tin cá
  nhân”, “Đổi mật khẩu”, “Ghi chú mới”, “Sửa ghi chú”, “Đăng ký”,
  “Quên mật khẩu”, “Xác minh OTP”, “Đặt mật khẩu mới”). Ba gốc tab
  (Trang chủ, Tài liệu, Tài khoản) giữ `Appbar` sẵn có, không back.
- `StatusBar` đặt một chỗ duy nhất ở root provider theo theme
  (sáng chữ tối / tối chữ sáng).

| Route | Mục đích | Component chính | Loading / empty / error / success |
|---|---|---|---|
| `/` | Chọn nhánh theo session | `LoadingState` | Loading khi khôi phục session; lỗi cấu hình hiển thị rõ; thành công redirect |
| `/dashboard` | Tab Trang chủ sau login: lưới 6 thẻ CN | `Card` + `Chip` (testID `dashboard-card-<id>`) | Không loading (không fetch); CN1 bấm tới `/notes`; CN2 tới tab Tài liệu; CN3–6 "Sắp có", bấm báo "đang phát triển" |
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
| `upload` | FAB/nút tải tài liệu lên (CN2) |
| `progress-clock` | Chip “Đang làm” thẻ CN2 trên dashboard |
| `note-text-outline` | Icon mỗi dòng ghi chú |
| `notebook-outline` | Empty danh sách notes |
| `format-title` / `text` | Ô tiêu đề / nội dung note |
| `trash-can-outline` | Nút Xóa ghi chú (màu error) |
| `theme-light-dark` | Chủ đề “Hệ thống” (toggle + SegmentedButtons) |
| `weather-sunny` | Chủ đề “Sáng” (toggle + SegmentedButtons) |
| `weather-night` | Chủ đề “Tối” (toggle + SegmentedButtons) |
| `file-document-outline` | Thẻ CN2 trên dashboard |
| `upload` | Nút tải tài liệu (CN2) — đã đối chiếu glyphmap |
| `progress-clock` | Chip “Đang làm” thẻ CN2 |
| `folder-outline` | Quản lý môn học (Appbar documents, màn subjects) |
| `open-in-new` | Nút “Mở tài liệu” ra app ngoài (CN2-G2) |
| `pencil` | Đổi tên tài liệu / môn học (CN2-G2) |
| `tag-outline` | Nút chọn môn ở chi tiết tài liệu (CN2-G2) |
| `magnify` | Ô tìm kiếm `Searchbar` màn documents (CN2-G2) |
| `text-box-outline` | Thẻ CN3 trên dashboard |
| `message-text-outline` | Thẻ CN4 trên dashboard |
| `lightbulb-outline` | Thẻ CN6 trên dashboard |
| `clock-outline` | Chip “Sắp có” trên dashboard |
| `home` | Tab Trang chủ (vỏ app-shell) |
| `account` | Tab Tài khoản (vỏ app-shell; dùng chung với ô họ tên) |

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

### Màn CN2 — tài liệu (route dự kiến, session code quyết định cuối)

| Route | FR | Trạng thái |
|---|---|---|
| `/documents` | FR-08, FR-12 (lọc theo môn) | Skeleton khi tải; empty (icon lớn + câu dẫn + nút “Tải tài liệu lên”, cấm chỉ in “Không có dữ liệu”); lỗi kèm “Thử lại”; pull-to-refresh; lọc theo môn qua Chip/Dropdown (“Tất cả” + từng môn + “Chưa phân loại”); đúng một ô tìm kiếm theo tên (`ilike`, phân biệt dấu). **G1 chỉ xong khung danh sách** (chưa tìm kiếm/lọc — g2) |
| `/documents/upload` | FR-06, FR-07 | `expo-document-picker` chọn 1 tệp → guard ext/MIME/size trước khi đọc → progress upload → success về danh sách + Snackbar; lỗi guard/signed URL/mất mạng báo rõ, không tạo bản ghi nửa vời |
| `/documents/[id]` | FR-09, FR-10, FR-11 | Loading fetch; hiển thị tên/ngày/dung lượng/định dạng/môn/trạng thái trích xuất; nút “Mở tài liệu” (`Linking.openURL`, tiện ích ngoài FR); đổi tên inline (validate 1–120); đổi môn học CHỈ ở đây; nút Xóa màu error + dialog xác nhận |
| `/subjects` | FR-12 | Danh sách môn + số tài liệu mỗi môn; tạo/sửa (validate 1–60, không trùng tên); xóa môn đang có tài liệu phải báo trước “tài liệu sẽ về Chưa phân loại” rồi mới cho xác nhận |

### Tầng dữ liệu CN2

Repository `src/features/documents/` (không import chéo sang feature khác;
dùng chung qua `src/shared/`):

- `pickDocument()` — bọc `expo-document-picker`, trả metadata (uri, name, size, mimeType), chưa đọc nội dung.
- `uploadDocument()` — guard ext/MIME/size + guard giới hạn 100 tài liệu (`count` trước insert) → đọc base64 bằng `expo-file-system` API mới (`File`) → decode ArrayBuffer (`base64-arraybuffer`) → upload lên `storage_path` → insert row `documents` (`extraction_status`: `pending` cho PDF/TXT, `unsupported` cho DOCX).
- `listDocuments()` (kèm `ilike` tìm kiếm theo tên + lọc môn) / `getDocument()` / `renameDocument()` / `deleteDocument()` qua typed client + RLS.
- `listSubjects()` / `createSubject()` (guard 30 môn) / `renameSubject()` / `deleteSubject()`.
- `getDocumentUrl()` — tạo signed URL TTL 3600s, cache 55 phút qua TanStack Query (giống `useAvatarUrl` CN1).

Query key và invalidate:

- `['documents', userId]` (danh sách, kèm filter môn ở client), `['document', docId]`, `['subjects', userId]`.
- Mutation upload/rename/delete/subject xong invalidate đúng key; không invalidate toàn bộ cache.

Giữ đồng bộ bản ghi DB ↔ object storage (FR-11 xóa, FR-06 tải lên):

- Xóa: xóa **object storage trước**, rồi mới xóa bản ghi DB. Storage lỗi → dừng, giữ bản ghi (UI không bao giờ trỏ vào hư không). DB lỗi sau khi storage đã xóa → còn object mồ côi: chấp nhận, log warning (dọn rác ngoài đề, không làm).
- Tải lên: upload storage trước → insert DB. Insert lỗi → xóa object vừa tạo best-effort rồi báo lỗi, không để bản ghi thiếu object.

### Màn CN3 — tóm tắt (route dự kiến, session code quyết định cuối)

| Route/vị trí | FR | Trạng thái |
|---|---|---|
| Vùng tóm tắt trong `/documents/[id]` (không route mới) | FR-14, FR-18 | Nút “Tóm tắt bằng AI” (DOCX ẩn nút + Banner gợi ý PDF); đang chạy → spinner + nút disabled; xong → văn bản tóm tắt; chưa có → empty dẫn bấm nút; lỗi → thông báo + “Thử lại” |
| Cùng vùng trên | FR-19, FR-20 | `failed` mới có “Thử lại”; `processing` treo (> 15 phút) tự thu hồi về `failed`; lỗi quota/429 → banner hạn mức, không retry |

Không route mới, không viewer mới: tóm tắt là một vùng trong màn chi tiết CN2
đã có (quyết định CN3-TRIGGER: bấm nút, không auto sau upload — mỗi lần bấm
tốn 1 request quota free nên phải do user chủ động).

### Tầng dữ liệu CN3

Repository `src/features/summary/` (không import chéo sang `documents`;
đọc `document_id`/`user_id` qua tham số, dùng chung qua `src/shared/`):

- `requestSummary(document)` — guard DOCX/`unsupported` + guard kích thước
  vượt ngưỡng (PDF > 50 MB) + guard đang `processing` → UPDATE
  `extraction_status = 'processing'` → gọi Gemini → upsert
  `document_summaries` (ghi đè theo `UNIQUE(document_id)`) → UPDATE
  `extraction_status = 'done'`; lỗi bất kỳ → `'failed'` + lỗi chuẩn hóa.
- `getSummary(documentId)` / `retrySummary()` (= `requestSummary` khi
  `failed`) / `reclaimStaleProcessing()` (thu hồi `processing` treo về
  `failed` khi `updated_at` quá 15 phút).
- `summarizeWithGemini()` — tầng gọi model, triển khai theo đúng MỘT nhánh
  probe CN3-01: nhánh proxy (fetch Edge Function + JWT Supabase tự gắn) hoặc
  nhánh trực tiếp (fetch REST Gemini + `EXPO_PUBLIC_GEMINI_API_KEY`). PDF gửi
  base64 inline nguyên file (≤ 10 MB < ngưỡng 50 MB, quyết định CN3-SIZE);
  TXT gửi text trực tiếp. Không lib trích xuất PDF (quyết định CN3-NOLIB).
  Kết quả probe 2026-09-20: deploy + nạp secret đều 403 thiếu quyền nên chốt
  nhánh trực tiếp cho bản demo (giới hạn đã biết, xem REPORT-NOTES); khi
  proxy deploy được thì quay lại đúng MỘT nhánh proxy, không giữ cả hai.
- Lỗi Gemini map sang tiếng Việt ở `errors.ts`: 429/quota → banner hạn mức
  (~1.500 lượt/ngày, reset nửa đêm giờ Thái Bình Dương); 5xx/mất mạng → retry
  tay; vượt 20.000 ký tự → báo rõ, không cắt im lặng.

Query key và invalidate:

- `['summary', documentId]` (bản tóm tắt), dùng chung `['document', docId]`
  của CN2 cho trạng thái trích xuất.
- Mutation xong invalidate cả hai key; không invalidate toàn bộ cache.

Chặn gọi lặp (FR-19): ba lớp — nút disabled khi mutation pending; guard
`processing` trong `requestSummary` (kể cả bấm từ hai chỗ cùng lúc, request
thứ hai thấy `processing` thì dừng); `UNIQUE(document_id)` chặn ghi đôi ở DB.

### Đường đi của key (proxy là đường đúng — chưa deploy được)

```text
Đường đúng (proxy, chờ deploy — key KHÔNG BAO GIỜ rời server):
app (JWT Supabase) → Edge Function gemini-proxy → Gemini 2.5 Flash
                      ├─ 401 nếu thiếu/sai JWT (getUser)
                      ├─ 500 nếu thiếu secret GEMINI_API_KEY
                      └─ Deno.env.get('GEMINI_API_KEY') chỉ sống trong server

Đường demo đang dùng (fallback sau probe 2026-09-20 — GIỚI HẠN ĐÃ BIẾT):
app (key trong bundle, giải nén ra được) → Gemini 2.5 Flash trực tiếp
```

- Source probe `supabase/functions/gemini-proxy/index.ts` đã nằm trong repo
  (không chứa secret): check JWT → đọc secret → gọi model với prompt cố định
  `"Trả lời đúng một từ: OK"`, chưa làm logic CN3.
- Probe 2026-09-20: `secrets set` và `functions deploy` đều 403 thiếu quyền
  (cùng họ với G2: token hiện tại chỉ đọc được), `secrets list` xác nhận chưa
  có `GEMINI_API_KEY` — bằng chứng trong REPORT-NOTES, cách mở lại trong
  SETUP mục 5d.
- Retry cùng ngày với access token MỚI (`chore/gemini-wired`): cả CLI lẫn
  Management API `POST .../functions/deploy` vẫn 403 cùng message; đối chiếu
  `GET .../functions` → `[]`, endpoint → 404 NOT_FOUND. Proxy vẫn là đường
  chốt kiến trúc nhưng CHƯA deploy được — nhánh demo `EXPO_PUBLIC_...` giữ
  nguyên hiệu lực tới khi owner deploy xong.
- Probe-2 (`chore/gemini-probe-2`, secret + deploy đã làm tay qua Dashboard vì
  PAT bị RBAC tầng organization chặn ghi): functions list có `gemini-proxy`
  ACTIVE (`verify_jwt: true`); gọi kèm JWT thật → 401 do bug `getUser()` không
  đối số (client Edge Function không giữ session) — đã sửa thành
  `getUser(token)` trong repo, chờ owner redeploy tay rồi curl lại kỳ vọng
  200; gọi không auth → 401 gateway (hàm không mở cho người lạ).
- Verify (`chore/cn3-proxy-verify`, sau redeploy tay từ source mới): functions
  list vẫn `version: 1` (không tăng); JWT mới chứng minh hợp lệ bằng
  `/auth/v1/user` → 200 nhưng probe kèm JWT vẫn 401 y hệt — bundle đang chạy
  khả năng vẫn là code cũ, redeploy chưa ăn source `getUser(token)` trong
  repo. CHƯA 200 nên hai nhánh giữ nguyên, không viết chốt.

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

Chỉ dùng hai biến public cần thiết cho client, cộng một biến demo CN3:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
EXPO_PUBLIC_REQUIRE_EMAIL_CONFIRMATION=false
# Nhánh demo CN3 sau probe 2026-09-20 (deploy proxy 403 thiếu quyền, FR-21):
# GIỚI HẠN ĐÃ BIẾT — key trong bundle giải nén ra được, chỉ dùng cho demo,
# xem REPORT-NOTES; khi proxy deploy được thì gỡ nhánh này.
# EXPO_PUBLIC_GEMINI_API_KEY=
```

- Commit `.env.example` với giá trị rỗng; `.env` và `.env.local` bị ignore.
- `src/lib/env.ts` đọc và kiểm tra ba biến ngay khi khởi tạo; thiếu/sai biến thì báo tên biến, không in giá trị.
- Cờ email confirmation chỉ điều khiển hành vi/thông báo của app; cấu hình thật vẫn phải tắt khi dev và bật khi demo trên Supabase Dashboard.
- Publishable/anon key được thiết kế để có mặt ở client nhưng **không phải** cơ chế phân quyền; RLS bảo vệ dữ liệu.
- Tuyệt đối không đưa `service_role`, database password, access token hoặc refresh token vào source/env client.
- Sau khi đổi env, khởi động lại Expo; không ghi key vào screenshot, DEVLOG hay báo cáo.
