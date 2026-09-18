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
