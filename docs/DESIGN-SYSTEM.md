# Hệ thống thiết kế dùng chung

Chuẩn giao diện cho cả 6 chức năng. Session này chỉ ban hành chuẩn trên giấy;
KHÔNG áp dụng vào code — session code CN2 chịu trách nhiệm áp dụng và đo kiểm.

## Bảng token màu MD3

Gốc hiện tại trong repo (`src/shared/theme/theme.ts`) là màu mặc định của
Paper (seed tím `primary40 #6750A4`), cộng thêm nhóm `success` tự định nghĩa:

| Token light | Giá trị đang dùng | Token dark | Giá trị đang dùng |
|---|---|---|---|
| `primary` | `#6750A4` | `primary` | `#D0BCFF` |
| `onPrimary` | `#FFFFFF` | `onPrimary` | `#381E72` |
| `primaryContainer` | `#EADDFF` | `primaryContainer` | `#4F378B` |
| `onPrimaryContainer` | `#21005D` | `onPrimaryContainer` | `#EADDFF` |
| `secondary` | `#625B71` | `secondary` | `#CCC2DC` |
| `onSecondary` | `#FFFFFF` | `onSecondary` | `#332D41` |
| `secondaryContainer` | `#E8DEF8` | `secondaryContainer` | `#4A4458` |
| `onSecondaryContainer` | `#1D1B20` | `onSecondaryContainer` | `#E8DEF8` |
| `tertiary` | `#7D5260` | `tertiary` | `#EFB8C8` |
| `onTertiary` | `#FFFFFF` | `onTertiary` | `#492532` |
| `tertiaryContainer` | `#FFD8E4` | `tertiaryContainer` | `#633B48` |
| `onTertiaryContainer` | `#31111D` | `onTertiaryContainer` | `#FFD8E4` |
| `surface` / `background` | `#FFFBFE` | `surface` / `background` | `#1C1B1F` |
| `onSurface` | `#1C1B1F` | `onSurface` | `#E6E1E5` |
| `surfaceVariant` | `#E7E0EC` | `surfaceVariant` | `#49454F` |
| `onSurfaceVariant` | `#49454F` | `onSurfaceVariant` | `#CAC4D0` |
| `error` / `onError` | `#B3261E` / `#FFFFFF` | `error` / `onError` | `#F2B8B5` / `#601410` |
| `errorContainer` / `onErrorContainer` | `#F9DEDC` / `#410E0B` | `errorContainer` / `onErrorContainer` | `#8C1D18` / `#F9DEDC` |
| `success` / `onSuccess` | `#1B7A3D` / `#FFFFFF` | `success` / `onSuccess` | `#6FDC8C` / `#00390F` |
| `successContainer` / `onSuccessContainer` | `#D9F2E3` / `#0C3B1E` | `successContainer` / `onSuccessContainer` | `#0C5A28` / `#D9F2E3` |
| `outline` / `outlineVariant` | `#79747E` / `#CAC4D0` | `outline` / `outlineVariant` | `#938F99` / `#49454F` |
| `inverseSurface` / `inverseOnSurface` / `inversePrimary` | `#313033` / `#F4EFF4` / `#D0BCFF` | `inverseSurface` / `inverseOnSurface` / `inversePrimary` | `#E6E1E5` / `#313033` / `#6750A4` |

Các giá trị trên đọc từ `react-native-paper` đang cài (MD3 baseline), không
bịa. Khi session code áp dụng: sinh lại toàn bộ nhóm `primary` / `secondary` /
`tertiary` từ seed indigo `#4A5FC1` bằng Material Theme Builder
(`material-color-utilities`), giữ nguyên nhóm `neutral`, `error`, `success`
trừ khi tool đổi theo. Sau khi sinh, cập nhật bảng này bằng giá trị thật.

## Màu phụ theo loại tệp

Dùng cho icon/nhãn phân biệt PDF/DOCX/TXT (CN2, dùng lại ở CN3–CN6).
Giá trị light đã tính tay theo WCAG với nền `surface #FFFBFE`:
PDF `#B3261E` ≈ 6.5:1, DOCX `#6750A4` ≈ 6.4:1, TXT `#7D5260` ≈ 6.5:1 —
đều đạt ngưỡng tối thiểu 4.5:1.

| Loại tệp | Light (trên nền sáng) | Dark (trên nền tối) |
|---|---|---|
| `pdf` | `#B3261E` | `#F9DEDC` |
| `docx` | `#6750A4` | `#EADDFF` |
| `txt` | `#7D5260` | `#FFD8E4` |

Biến thể dark là tonal sáng (≥80) trên nền `#1C1B1F` nên tương phản luôn
cao theo cấu trúc MD3. Session code BẮT BUỘC đo lại cả 6 cặp bằng công cụ
(Stark, Axes hoặc WebAIM) trước khi chốt; cặp nào dưới 4.5:1 thì nâng tonal
rồi đo lại, không dùng bừa.

## Spacing, bo góc

Thang spacing duy nhất (`src/shared/theme/spacing.ts`): `xs 4`, `sm 8`,
`md 12`, `lg 16`, `xl 24`, `xxl 32`. Cấm rải số lẻ trong style.

Bo góc: card 16 (`radius.xl`), chip 8 (`radius.md`), bottom sheet 28
(token mới `radius.sheet = 28`, thêm khi session code áp dụng; hiện tại
`radius` lớn nhất là `xl 16`).

## Quy ước trạng thái

- Loading dùng skeleton placeholder (`ListSkeleton` có sẵn), không đặt
  `ActivityIndicator` trơ trọi giữa màn.
- Empty state gồm đúng 3 phần: icon lớn, một câu dẫn, một nút hành động chính.
  Cấm chỉ in chữ “Không có dữ liệu”.
- Lỗi luôn kèm nút “Thử lại” gọi `refetch`; không để màn kẹt ở trạng thái lỗi.

## Quy ước phản hồi

- Thao tác thành công → Snackbar (`FeedbackSnackbar`), không dùng Alert.
- Chỉ thao tác phá hủy (xóa tài liệu, xóa môn học, xóa note, đăng xuất nếu
  cần xác nhận) mới dùng hộp thoại xác nhận.
- Lỗi field nằm ngay dưới ô nhập; giữ dữ liệu form khi lỗi mạng để thử lại.

## Quy tắc theme

- Mọi màn phải đẹp ở cả light lẫn dark; màu chỉ đọc từ `theme.colors`
  (qua `useTheme<AppTheme>()`), cấm hardcode hex/rgb ngoài file theme.
- Không custom font; typography dùng variant sẵn của Paper.

## Checklist “một màn hình được coi là hoàn thành”

- [ ] Chạy được cả light và dark, không có chữ trùng màu nền (soi từng state).
- [ ] Đủ 4 trạng thái loading (skeleton) / empty (icon + câu dẫn + CTA) /
      error (kèm Thử lại) / success theo quy ước trên.
- [ ] Không hardcode màu; spacing/radius dùng token.
- [ ] Control chỉ có icon có `accessibilityLabel`; vùng bấm tối thiểu 44×44.
- [ ] Cặp màu mới (nếu có) đã đo tương phản ≥ 4.5:1 bằng công cụ, ghi kết quả
      vào TEST-CHECKLIST.
- [ ] Test tay trên Expo Go theo `docs/TEST-CHECKLIST.md` đạt.
