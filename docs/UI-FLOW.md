# Luồng UI

## Sơ đồ điều hướng

```text
Khởi động `/`
├─ đang khôi phục session → splash/loading
├─ chưa login → `/sign-in`
│  ├─ `/sign-up` → vào app khi dev / xác nhận email khi demo
│  └─ `/forgot-password` → email → `/verify-reset-otp` → `/reset-password`
└─ đã login → `/notes`
   ├─ `/notes/new` → tạo → `/notes`
   ├─ `/notes/[id]` → sửa/xóa → `/notes`
   └─ `/profile` → cập nhật / đăng xuất → `/sign-in`
```

Route group `(auth)` và `(app)` không xuất hiện trong URL. Layout mỗi group thực hiện guard; redirect chỉ sau khi `useSession` hoàn tất loading.

## Màn hình và trạng thái (G6)

Mọi màn hình dùng `ScreenContainer` (SafeArea + KeyboardAvoidingView +
ScrollView theo token `src/theme`); tiêu đề `headlineSmall`, phụ đề
`bodyMedium`; không dùng `<Text>` trần cho tiêu đề. Nút submit chính
`mode="contained"` có icon, `loading` + `disabled` khi đang gửi; link phụ
`mode="text"`.

## Quy ước header (G6.1)

- Header duy nhất là Paper `Appbar`; **toàn bộ Stack để
  `headerShown: false`** (root, `(app)`, `(auth)`) kèm `contentStyle` nền
  theo theme để hết dải trắng/flash trắng khi chuyển màn.
- Navigation theme (`ThemeProvider` từ `expo-router`) suy ra từ theme MD3
  G6 qua `adaptNavigationTheme` (`src/theme/navigation.ts`) — một nguồn
  theme duy nhất, chọn light/dark theo `useColorScheme`.
- Màn con trong `(app)` (profile, đổi mật khẩu, tạo/sửa note) dùng
  `ScreenHeader` qua prop `header` của `ScreenContainer` (trong SafeArea,
  ngoài ScrollView): `Appbar.BackAction` (label “Quay lại”) chỉ render khi
  `router.canGoBack()`, `Appbar.Content` title tiếng Việt (“Thông tin cá
  nhân”, “Đổi mật khẩu”, “Ghi chú mới”, “Sửa ghi chú”). Màn Notes giữ
  `Appbar` sẵn có làm header duy nhất.
- `StatusBar` đặt một chỗ duy nhất ở root provider theo theme
  (sáng chữ tối / tối chữ sáng).

| Route | Mục đích | Component chính | Loading / empty / error / success |
|---|---|---|---|
| `/` | Chọn nhánh theo session | `LoadingState` | Loading khi khôi phục session; lỗi cấu hình hiển thị rõ; thành công redirect |
| `/sign-in` | FR-02 đăng nhập | `FormTextInput` (email `email-outline`), `PasswordInput`, `Button` icon `login` (testID `login-submit`), link đăng ký/quên mật khẩu | Button spinner; không có empty; lỗi field/API; thành công về `/notes` |
| `/sign-up` | FR-01 đăng ký | Full name (`account`)/student code (`badge-account-horizontal-outline`)/email (`email-outline`) + 2 `PasswordInput` (testID `password-toggle`, `password-confirm-toggle`), nút icon `account-plus` (testID `register-submit`) | Spinner; lỗi Zod/email hoặc student code trùng; dev vào app ngay, demo yêu cầu kiểm tra email theo env |
| `/forgot-password` | FR-03 gửi email reset | Email form icon `email-outline`, nút icon `send` (testID `forgot-submit`) | Spinner; luôn dùng thông báo success trung tính; offline cho retry |
| `/verify-reset-otp` | FR-03 xác minh mã | Ô OTP icon `numeric`, căn giữa + letterSpacing rộng (testID `otp-input`), nút Xác minh icon `check` (testID `otp-submit`), nút gửi lại icon `refresh` (testID `otp-resend`) | Spinner; OTP sai/hết hạn báo lỗi; success tạo recovery session rồi sang reset |
| `/reset-password` | FR-03 đặt mật khẩu mới | 2 `PasswordInput` + độ mạnh mật khẩu, nút icon `check` (testID `reset-submit`) | Thiếu recovery session thì về verify OTP; thành công về sign-in |
| `/notes` | FR-05 danh sách riêng | `Appbar` (action `account-circle`), `List.Item` icon `note-text-outline` + `Divider`, `FAB` icon `plus` (testID `notes-fab`), `EmptyState` icon `notebook-outline` | `ListSkeleton` khi tải; empty có CTA “Tạo ghi chú”; lỗi có Retry; pull-to-refresh nối vào `refetch`; success danh sách theo `updated_at desc` |
| `/notes/new` | FR-05 tạo note | Title (`format-title`)/content (`text`) form, nút icon `content-save` (testID `note-save`) | Spinner khi lưu; lỗi validation/API; success invalidate `notes` rồi back |
| `/notes/[id]` | FR-05 sửa/xóa note | Form, nút Lưu icon `content-save` (testID `note-update`), nút Xóa icon `trash-can-outline` màu error, confirm dialog | Loading fetch; không tìm thấy/không có quyền dùng cùng thông báo; lỗi retry; success back |
| `/profile` | FR-04 xem/sửa hồ sơ, avatar, logout | `ProfileView` (thuần hiển thị) + container query/mutation; avatar bọc `Pressable` overlay icon `camera` (testID `avatar-picker`, label “Đổi ảnh đại diện”); nút Lưu icon `content-save` (testID `profile-save`); link đổi mật khẩu icon `lock-reset`; nút đăng xuất icon `logout` màu error; `FeedbackSnackbar` thay Alert | Profile loading → spinner “Đang tải hồ sơ…”; query lỗi → `EmptyState` “Không tải được hồ sơ.” + nút “Thử lại” (testID `profile-retry`, gọi refetch); ready → form + avatar; lưu/upload pending → disable + spinner trên nút; success/error báo bằng Snackbar (không Alert), xem chi tiết luồng avatar bên dưới |
| `/profile/change-password` | FR-03 đổi pass khi đã login | 3 `PasswordInput`, nút icon `lock-reset` (testID `change-password-submit`) | Spinner; sai pass hiện tại/trùng pass cũ báo riêng; success banner + về hồ sơ |

## Bảng icon (G6, MaterialCommunityIcons qua settings.icon)

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
| `account-circle` | Appbar mở hồ sơ |
| `content-save` | Nút Lưu (profile, tạo/sửa note) |
| `logout` | Nút Đăng xuất (màu error) |
| `plus` | FAB thêm ghi chú |
| `note-text-outline` | Icon mỗi dòng ghi chú |
| `notebook-outline` | Empty danh sách notes |
| `format-title` / `text` | Ô tiêu đề / nội dung note |
| `trash-can-outline` | Nút Xóa ghi chú (màu error) |

Mọi control chỉ có icon đều có `accessibilityLabel` và vùng bấm tối thiểu
44x44 (avatar `Pressable` dùng `hitSlop` + `minHeight/minWidth`).

## Luồng đổi avatar (`/profile`, FR-04)

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

## Hành vi theo trạng thái xác thực

- Chưa login truy cập route `(app)`: `replace('/sign-in')`, không để Back quay vào dữ liệu cũ.
- Đã login truy cập route `(auth)` trừ luồng recovery hợp lệ: `replace('/notes')`.
- Recovery session chỉ được tạo sau `verifyOtp` thành công; không phụ thuộc deep link. Deep link chỉ bổ sung nếu G1–G5 đã hoàn tất và còn thời gian.
- Khi logout hoặc token refresh thất bại: xóa cache React Query chứa dữ liệu user, đóng route riêng tư và về `/sign-in`.
- Khi app quay lại foreground: Supabase tiếp tục auto-refresh token; UI giữ loading ngắn trong lúc xác định session.

## Quy tắc form và phản hồi

- Validate khi submit, lỗi nằm ngay dưới field; password không log/giữ ngoài form.
- Chặn submit lặp trong mutation; giữ dữ liệu form khi lỗi mạng để người dùng thử lại.
- Delete note bắt buộc confirm; chỉ đóng màn hình sau khi server xác nhận.
- Mọi màn hình có keyboard avoidance và label accessibility cơ bản.
- Thông báo đăng ký/quên mật khẩu không tiết lộ email đã tồn tại nếu Supabase cấu hình trả phản hồi trung tính; test vẫn xác nhận không tạo duplicate.
