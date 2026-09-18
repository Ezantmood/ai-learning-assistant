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

## Màn hình và trạng thái

| Route | Mục đích | Component chính | Loading / empty / error / success |
|---|---|---|---|
| `/` | Chọn nhánh theo session | `FullScreenStatus` | Loading khi khôi phục session; lỗi cấu hình hiển thị rõ; thành công redirect |
| `/sign-in` | FR-02 đăng nhập | `FormTextField`, `Button`, link đăng ký/quên mật khẩu | Button spinner; không có empty; lỗi field/API; thành công về `/notes` |
| `/sign-up` | FR-01 đăng ký | Full name/student code/email/password/confirm form | Spinner; lỗi Zod/email hoặc student code trùng; dev vào app ngay, demo yêu cầu kiểm tra email theo env |
| `/forgot-password` | FR-03 gửi email reset | Email form | Spinner; luôn dùng thông báo success trung tính; offline cho retry |
| `/verify-reset-otp` | FR-03 xác minh mã | Email + OTP 6 số form | Spinner; OTP sai/hết hạn báo lỗi; success tạo recovery session rồi sang reset |
| `/reset-password` | FR-03 đặt mật khẩu mới | Password/confirm form | Thiếu recovery session thì về verify OTP; thành công về sign-in |
| `/notes` | FR-05 danh sách riêng | `Appbar`, `FAB`, list/card | Skeleton/spinner; empty có CTA “Tạo ghi chú”; lỗi có Retry; success danh sách theo `updated_at desc` |
| `/notes/new` | FR-05 tạo note | Title/content form | Spinner khi lưu; lỗi validation/API; success invalidate `notes` rồi back |
| `/notes/[id]` | FR-05 sửa/xóa note | Form, nút Delete, confirm dialog | Loading fetch; không tìm thấy/không có quyền dùng cùng thông báo; lỗi retry; success back |
| `/profile` | FR-04 xem/sửa hồ sơ, avatar, logout | `ProfileView` (thuần hiển thị) + container query/mutation, nút đổi avatar/lưu, link đổi mật khẩu, nút đăng xuất | Profile loading → spinner “Đang tải hồ sơ…”; query lỗi → “Không tải được hồ sơ.” + nút “Thử lại” (refetch); ready → form + avatar; lưu/upload pending → disable + spinner trên nút; success/error báo bằng Snackbar (không Alert), xem chi tiết luồng avatar bên dưới |
| `/profile/change-password` | FR-03 đổi pass khi đã login | Current/new/confirm form | Spinner; sai pass hiện tại/trùng pass cũ báo riêng; success banner + về hồ sơ |

## Luồng đổi avatar (`/profile`, FR-04)

```text
“Đổi avatar” → xin quyền thư viện (từ chối → Snackbar + nút “Mở Cài đặt”)
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
