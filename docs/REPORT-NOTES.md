# Nguyên liệu báo cáo và vấn đáp

Chỉ điền bằng bằng chứng từ code/test thực tế. Không tuyên bố FR “đạt” trước khi `FR-TRACEABILITY.md` và checklist đã cập nhật.

## Khung báo cáo

1. **Bài toán:** quản lý tài khoản sinh viên; năm FR; phạm vi 5 ngày.
2. **Phạm vi:** Auth, profile, avatar, một bảng `study_notes`; nêu rõ out of scope.
3. **Công nghệ:** Expo SDK 57/TypeScript strict; expo-router; Supabase; form/query/UI libraries; lý do từ `ARCHITECTURE.md`.
4. **Kiến trúc:** sơ đồ screen → feature API → Supabase; route guard; server state và auth state.
5. **Mô hình dữ liệu:** `profiles`, `study_notes`, trigger tạo profile/cập nhật timestamp; Storage private.
6. **Bảo mật:** JWT cung cấp `auth.uid()`; RLS cho từng lệnh; publishable key không thay thế policy; không có service-role key trong app.
7. **Luồng chính:** đăng ký, login/logout, reset password/deep link, sửa profile/avatar, CRUD note.
8. **Kiểm thử:** bảng kết quả tốt/xấu; bằng chứng A/B cho RLS; lỗi offline/token/link hết hạn.
9. **Git:** một branch/giai đoạn, commit theo task, PR review, tag mốc.
10. **Giới hạn và bài học:** chỉ ghi điều thực tế sau G5.

## Ảnh/bằng chứng cần chuẩn bị

- Mỗi màn hình ở trạng thái success và ít nhất một error/empty/loading tiêu biểu.
- Dashboard cho thấy RLS enabled và bucket `avatars` private; che project ref/key/email.
- Kết quả truy cập chéo A/B cho SELECT/INSERT/UPDATE/DELETE.
- `git log --oneline --decorate --graph --all` cho các mốc G1..G5.
- Output type check/lint cuối; không chụp `.env`.

## Câu hỏi vấn đáp và trả lời gợi ý

**Vì sao cần RLS khi client đã filter `user_id`?**

Client do người dùng kiểm soát và filter có thể bị bỏ/sửa. RLS chạy trong Postgres, kiểm tra JWT qua `auth.uid()` cho mọi request nên mới là ranh giới bảo mật.

**Publishable/anon key có phải secret không?**

Không; key này nằm trong client và chỉ nhận quyền của role public/authenticated. An toàn dữ liệu phụ thuộc RLS. `service_role` mới tuyệt đối không được đưa vào app vì có thể vượt RLS.

**Vì sao `profiles.id` tham chiếu `auth.users.id`?**

Quan hệ một-một đơn giản: cùng UUID vừa xác định profile vừa đối chiếu `auth.uid()`, và `on delete cascade` tránh dữ liệu mồ côi.

**Trigger tạo profile để làm gì?**

Đảm bảo mỗi Auth user có profile dù client đóng app ngay sau sign-up; invariant nằm ở database thay vì phụ thuộc hai request từ client.

**Vì sao UPDATE cần cả `USING` và `WITH CHECK`?**

`USING` giới hạn row được chọn để sửa; `WITH CHECK` giới hạn giá trị sau sửa, ngăn đổi `user_id` sang người khác.

**AsyncStorage dùng để làm gì?**

Là storage adapter để Supabase JS duy trì session React Native giữa các lần mở app; không dùng để lưu profile/note làm nguồn dữ liệu chính.

**React Query khác React Hook Form thế nào?**

React Query quản lý dữ liệu server/caching/invalidation; React Hook Form quản lý input và trạng thái form cục bộ; Zod định nghĩa validation.

**Token hết hạn xử lý thế nào?**

Supabase tự refresh khi app foreground nếu refresh token còn hợp lệ. Nếu refresh thất bại, app xóa cache riêng tư và đưa về sign-in.

**Tại sao bucket avatar là private?**

Avatar là dữ liệu tài khoản. Private bucket buộc truy cập qua policy/signed URL, thể hiện rõ quyền sở hữu thay vì URL công khai vĩnh viễn.

**Vì sao chỉ có `study_notes`?**

FR-05 yêu cầu chứng minh cách ly dữ liệu học tập; title/content và CRUD là mẫu nhỏ nhất đủ kiểm chứng, tránh mở rộng ngoài đề.

**Nếu thao tác offline thì sao?**

Phạm vi không có offline-first. UI giữ form, báo lỗi và cho retry; không giả lập thành công hay tự tạo hàng đợi đồng bộ.

**Vì sao không viết backend riêng?**

Supabase cung cấp Auth, Data API, Postgres RLS và Storage đủ cho phạm vi; backend riêng làm tăng code và điểm lỗi mà không thêm giá trị cho năm FR.
