# Luồng UI

## Sơ đồ điều hướng

```text
Khởi động `/`
├─ đang khôi phục session → splash/loading
├─ chưa login → `/sign-in`
│  ├─ `/sign-up` → thông báo xác nhận → `/sign-in`
│  └─ `/forgot-password` → email → deep link `/reset-password`
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
| `/sign-up` | FR-01 đăng ký | Full name/student code/email/password/confirm form | Spinner; lỗi Zod/email hoặc student code trùng; thành công yêu cầu kiểm tra email |
| `/forgot-password` | FR-03 gửi email reset | Email form | Spinner; luôn dùng thông báo success trung tính; offline cho retry |
| `/reset-password` | FR-03 đặt mật khẩu mới | Password/confirm form | Loading xác minh recovery session; link thiếu/hết hạn báo lỗi + về forgot; thành công về sign-in |
| `/notes` | FR-05 danh sách riêng | `Appbar`, `FAB`, list/card | Skeleton/spinner; empty có CTA “Tạo ghi chú”; lỗi có Retry; success danh sách theo `updated_at desc` |
| `/notes/new` | FR-05 tạo note | Title/content form | Spinner khi lưu; lỗi validation/API; success invalidate `notes` rồi back |
| `/notes/[id]` | FR-05 sửa/xóa note | Form, nút Delete, confirm dialog | Loading fetch; không tìm thấy/không có quyền dùng cùng thông báo; lỗi retry; success back |
| `/profile` | FR-04 xem/sửa hồ sơ, avatar, logout | Avatar picker, form, logout button | Loading profile/avatar; avatar trống dùng initials; lỗi retry; success cập nhật cache/snackbar |

## Hành vi theo trạng thái xác thực

- Chưa login truy cập route `(app)`: `replace('/sign-in')`, không để Back quay vào dữ liệu cũ.
- Đã login truy cập route `(auth)` trừ `/reset-password`: `replace('/notes')`.
- Recovery deep link được xử lý trước redirect thông thường để `/reset-password` nhận recovery session.
- Khi logout hoặc token refresh thất bại: xóa cache React Query chứa dữ liệu user, đóng route riêng tư và về `/sign-in`.
- Khi app quay lại foreground: Supabase tiếp tục auto-refresh token; UI giữ loading ngắn trong lúc xác định session.

## Quy tắc form và phản hồi

- Validate khi submit, lỗi nằm ngay dưới field; password không log/giữ ngoài form.
- Chặn submit lặp trong mutation; giữ dữ liệu form khi lỗi mạng để người dùng thử lại.
- Delete note bắt buộc confirm; chỉ đóng màn hình sau khi server xác nhận.
- Mọi màn hình có keyboard avoidance và label accessibility cơ bản.
- Thông báo đăng ký/quên mật khẩu không tiết lộ email đã tồn tại nếu Supabase cấu hình trả phản hồi trung tính; test vẫn xác nhận không tạo duplicate.
