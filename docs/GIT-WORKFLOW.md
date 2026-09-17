# Quy trình Git cho người mới

## Bản đồ giai đoạn

| Giai đoạn | Branch | Tag sau merge | Nội dung |
|---|---|---|---|
| G1 | `feat/g1-setup` | `g1-done` | Expo, dependency, env, providers, route guard |
| G2 | `feat/g2-database` | `g2-done` | Schema, trigger, RLS, Storage, database types |
| G3 | `feat/g3-auth-core` | `g3-done` | Đăng ký, login/logout, CRUD notes |
| G4 | `feat/g4-password-reset` | `g4-done` | Forgot/reset password bằng OTP email |
| G5 | `feat/g5-profile-docs` | `g5-done` | Profile/avatar, test tổng, tài liệu cuối |

Commit tài liệu bootstrap hiện tại trên `main` là ngoại lệ do chủ dự án yêu cầu để tạo nền repo. Từ G1 trở đi không commit trực tiếp lên `main`.

## Bắt đầu một giai đoạn

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/g1-setup
```

Đổi tên branch theo bảng. Mở `docs/TASKS.md`, chỉ làm một checkbox tại một thời điểm.

## Commit từng task

1. Xem `git status` và `git diff`; không stage file ngoài task.
2. Chạy `npx tsc --noEmit`, `npm run lint`, test tay liên quan; app phải mở không crash.
3. Stage file tường minh, ví dụ `git add app/_layout.tsx src/providers/AppProviders.tsx`.
4. Xem `git diff --cached`; tìm key/token/password. Có dấu hiệu secret thì dừng, unstage và báo chủ dự án.
5. Commit rồi push ngay:

```bash
git commit -m "feat(auth): thêm đăng nhập bằng email" -m "Refs: FR-02"
git push -u origin feat/g3-auth-core
```

Mẫu message:

```text
<type>(<scope>): <mô tả tiếng Việt ngắn>

<lý do nếu không hiển nhiên>

Refs: FR-0X
```

Type: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`. Scope: `auth`, `profile`, `db`, `ui`, `config`, `docs`.

## Mở và review PR

1. Push branch, mở PR từ branch giai đoạn vào `main`.
2. PR phải ghi: checkbox đã làm; cách test và kết quả; FR liên quan; giới hạn/còn nợ; xác nhận không có secret.
3. Chủ dự án xem tab Files changed, chạy lại test cần thiết và comment chỗ cần sửa.
4. Người làm sửa trên cùng branch, commit/push từng task sửa; không force-push/rebase.
5. Khi PR sẵn sàng thì **dừng chờ chủ dự án merge**, không tự merge.

## Sau khi chủ dự án merge

```bash
git switch main
git pull --ff-only origin main
git tag g1-done
git push origin g1-done
```

Đổi tag theo bảng và ghi full commit hash, branch, tag, PR vào `docs/DEVLOG.md`. Trước khi tạo tag, `git show g1-done` không được tồn tại; không di chuyển tag đã push.

## Xem và quay lại mốc an toàn

- Xem lịch sử: `git log --oneline --decorate --graph --all`.
- Xem mốc cũ mà không sửa branch: `git switch --detach g2-done`; quay lại bằng `git switch main`.
- Tạo branch để khảo sát/sửa từ mốc: `git switch -c inspect-g2 g2-done` (chỉ khi thực sự cần và đã thống nhất).
- Hoàn tác commit đã push: `git revert <commit-hash>`, giải quyết conflict nếu có, test, rồi push commit revert.
- Không dùng `reset --hard` khi có thay đổi chưa commit; không rebase branch đã chia sẻ; không `push --force`.

Nếu secret từng vào commit: dừng ngay, báo chủ dự án và rotate key. Không tự sửa lịch sử bằng filter-branch/force-push.
