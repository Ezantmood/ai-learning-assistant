# Hệ thống thiết kế dùng chung

Chuẩn giao diện cho cả 6 chức năng. Bảng màu riêng đã áp vào code ở
CN2-13 (seed indigo `#4A5FC1`); mục file-type giữ nguyên màu, chỉ cập
nhật lại tỉ số trên nền mới.

## Bảng token màu MD3

Sinh từ seed indigo `#4A5FC1` bằng Material Theme Builder
(`@material/material-color-utilities`, variant TonalSpot — mặc định của
tool), áp từ CN2-13. Cách sinh: lấy tonal palette TonalSpot của seed rồi
giữ nguyên ánh xạ tone → token của `MD3LightTheme`/`MD3DarkTheme` trong
`react-native-paper` đang cài (VD light `primary` = tone 40); nhóm
`success` tự định nghĩa giữ nguyên; `elevation`/`surfaceDisabled`/
`backdrop` tính lại theo đúng công thức Paper. Code: `src/shared/theme/theme.ts`.

| Token light | Giá trị đang dùng | Token dark | Giá trị đang dùng |
|---|---|---|---|
| `primary` | `#505B92` | `primary` | `#B9C3FF` |
| `onPrimary` | `#FFFFFF` | `onPrimary` | `#212C61` |
| `primaryContainer` | `#DDE1FF` | `primaryContainer` | `#384379` |
| `onPrimaryContainer` | `#09164B` | `onPrimaryContainer` | `#DDE1FF` |
| `secondary` | `#5A5D72` | `secondary` | `#C3C5DD` |
| `onSecondary` | `#FFFFFF` | `onSecondary` | `#2C2F42` |
| `secondaryContainer` | `#DFE1F9` | `secondaryContainer` | `#434659` |
| `onSecondaryContainer` | `#171B2C` | `onSecondaryContainer` | `#DFE1F9` |
| `tertiary` | `#76546E` | `tertiary` | `#E5BAD8` |
| `onTertiary` | `#FFFFFF` | `onTertiary` | `#44263E` |
| `tertiaryContainer` | `#FFD7F2` | `tertiaryContainer` | `#5C3C55` |
| `onTertiaryContainer` | `#2D1228` | `onTertiaryContainer` | `#FFD7F2` |
| `surface` / `background` | `#FEFBFF` | `surface` / `background` | `#1B1B21` |
| `onSurface` | `#1B1B21` | `onSurface` | `#E3E1E9` |
| `surfaceVariant` | `#E3E1EC` | `surfaceVariant` | `#45464F` |
| `onSurfaceVariant` | `#45464F` | `onSurfaceVariant` | `#C6C5D0` |
| `error` / `onError` | `#BA1A1A` / `#FFFFFF` | `error` / `onError` | `#FFB4AB` / `#690005` |
| `errorContainer` / `onErrorContainer` | `#FFDAD6` / `#410002` | `errorContainer` / `onErrorContainer` | `#93000A` / `#FFDAD6` |
| `success` / `onSuccess` | `#1B7A3D` / `#FFFFFF` | `success` / `onSuccess` | `#6FDC8C` / `#00390F` |
| `successContainer` / `onSuccessContainer` | `#D9F2E3` / `#0C3B1E` | `successContainer` / `onSuccessContainer` | `#0C5A28` / `#D9F2E3` |
| `outline` / `outlineVariant` | `#767680` / `#C6C5D0` | `outline` / `outlineVariant` | `#90909A` / `#45464F` |
| `inverseSurface` / `inverseOnSurface` / `inversePrimary` | `#303036` / `#F2F0F7` / `#B9C3FF` | `inverseSurface` / `inverseOnSurface` / `inversePrimary` | `#E3E1E9` / `#303036` / `#505B92` |

Tương phản WCAG (tính theo công thức chuẩn ở mục dưới, làm tròn 2 chữ
số): mọi cặp chữ/nền đều vượt 4.5:1. Yếu nhất light là
`onSuccess`/`success` 5.39:1 và `onPrimary`/`primary` 6.46:1; yếu nhất
dark là `inversePrimary`/`inverseSurface` 4.98:1 và
`onSurfaceVariant`/`surfaceVariant` 5.49:1; còn lại đều ≥ 6.4:1
(light) và ≥ 7.2:1 (dark). Không cặp nào phải chỉnh màu.

## Màu phụ theo loại tệp

Dùng cho icon/nhãn phân biệt PDF/DOCX/TXT (CN2, dùng lại ở CN3–CN6).
Tỉ số tương phản WCAG tự tính theo công thức chuẩn (hex → sRGB tuyến tính →
luminance tương đối → `(L1+0.05)/(L2+0.05)`), làm tròn 2 chữ số:

| Loại tệp | Light (nền `#FEFBFF`) | Tỉ số | Dark (nền `#1B1B21`) | Tỉ số |
|---|---|---|---|---|
| `pdf` | `#B3261E` | 6.37:1 | `#F9DEDC` | 13.47:1 |
| `docx` | `#6750A4` | 6.27:1 | `#EADDFF` | 13.29:1 |
| `txt` | `#7D5260` | 6.30:1 | `#FFD8E4` | 13.22:1 |

Cả 6 cặp đều vượt ngưỡng tối thiểu 4.5:1 trên nền mới (CN2-13 đo lại sau
khi đổi theme; màu giữ nguyên vì không cặp nào rớt), chốt dùng luôn,
không cần đo lại.

## Spacing, bo góc

Thang spacing duy nhất (`src/shared/theme/spacing.ts`): `xs 4`, `sm 8`,
`md 12`, `lg 16`, `xl 24`, `xxl 32`. Cấm rải số lẻ trong style.

Bo góc: card 16 (`radius.xl`), chip 8 (`radius.md`), bottom sheet 28
(`radius.sheet`).

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
- [ ] Cặp màu mới (nếu có ngoài bảng file-type) đã tính tương phản ≥ 4.5:1
      theo công thức WCAG ở mục “Màu phụ theo loại tệp”, ghi số vào TEST-CHECKLIST.
- [ ] Test tay trên Expo Go theo `docs/TEST-CHECKLIST.md` đạt.
