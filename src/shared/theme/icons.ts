/**
 * Tên icon MaterialCommunityIcons dùng trong app (fix/icons-cn1-cn2).
 *
 * Bẫy đã vỡ: Paper resolve icon chuỗi qua `settings.icon` sang
 * MaterialCommunityIcons; tên sai render rỗng IM LẶNG, không warning.
 * Mọi màn hình trong `app/(app)` + `src/features/profile` (+ tab bar,
 * Trang chủ, toggle theme) lấy tên từ đây, CẤM rải literal inline.
 * Cổng gác: `src/shared/theme/__tests__/icons.test.ts` assert từng tên
 * tồn tại trong glyphMap thật của `@expo/vector-icons`.
 *
 * Đối chiếu bằng glyphMap thật
 * (`node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/
 * glyphmaps/MaterialCommunityIcons.json`, 7448 glyph, 2026-09-21):
 * toàn bộ tên dưới đây đều CÓ trong glyphMap.
 */
export const AppIcons = {
  account: 'account',
  accountCircle: 'account-circle',
  accountPlus: 'account-plus',
  alertCircle: 'alert-circle',
  badgeAccountHorizontalOutline: 'badge-account-horizontal-outline',
  camera: 'camera',
  check: 'check',
  checkCircle: 'check-circle',
  clockOutline: 'clock-outline',
  close: 'close',
  contentSave: 'content-save',
  emailCheck: 'email-check',
  emailOutline: 'email-outline',
  eye: 'eye',
  eyeOff: 'eye-off',
  fileDocumentOutline: 'file-document-outline',
  folderOutline: 'folder-outline',
  formatTitle: 'format-title',
  history: 'history',
  imageOutline: 'image-outline',
  home: 'home',
  information: 'information',
  lightbulbOutline: 'lightbulb-outline',
  lockOutline: 'lock-outline',
  lockReset: 'lock-reset',
  login: 'login',
  logout: 'logout',
  messageTextOutline: 'message-text-outline',
  noteTextOutline: 'note-text-outline',
  notebookOutline: 'notebook-outline',
  numeric: 'numeric',
  openInNew: 'open-in-new',
  pencil: 'pencil',
  plus: 'plus',
  progressClock: 'progress-clock',
  refresh: 'refresh',
  send: 'send',
  tagOutline: 'tag-outline',
  text: 'text',
  textBoxOutline: 'text-box-outline',
  themeLightDark: 'theme-light-dark',
  trashCanOutline: 'trash-can-outline',
  upload: 'upload',
  weatherNight: 'weather-night',
  weatherSunny: 'weather-sunny',
} as const;

export type AppIconName = (typeof AppIcons)[keyof typeof AppIcons];

/** Mọi icon app dùng — test cổng gác duyệt mảng này. */
export const ALL_APP_ICONS: readonly AppIconName[] = Object.values(AppIcons);

/**
 * Icon 3 tab bottom navigation (fix-tabbar-icons).
 *
 * tabBarIcon của expo-router render MaterialCommunityIcons TRỰC TIẾP,
 * không qua `settings.icon` của Paper nên tên lạ đặt ngoài AppIcons lọt
 * lưới cổng ALL_APP_ICONS (tên sai hiện tofu box thay vì rỗng im lặng).
 * File tab chỉ được trỏ hằng này, CẤM literal tên icon.
 * Test: `src/shared/theme/__tests__/tabBarIcons.test.ts`.
 */
export const TAB_BAR_ICONS = {
  home: AppIcons.home,
  documents: AppIcons.fileDocumentOutline,
  profile: AppIcons.account,
} as const;

export type TabBarIconName =
  (typeof TAB_BAR_ICONS)[keyof typeof TAB_BAR_ICONS];
