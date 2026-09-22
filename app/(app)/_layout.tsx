import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { LoadingState } from '../../src/shared/components/LoadingState';
import { useSession } from '../../src/features/auth/useSession';
import { useThemeMode } from '../../src/shared/theme/ThemeContext';
import { TAB_BAR_ICONS } from '../../src/shared/theme/icons';

type TabIconProps = {
  color: React.ComponentProps<typeof MaterialCommunityIcons>['color'];
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  size: number;
};

function TabIcon({ color, name, size }: TabIconProps) {
  return <MaterialCommunityIcons color={color} name={name} size={size} />;
}

/** Màn con (không phải tab): ẩn khỏi tab bar và ẩn luôn tab bar khi mở. */
const HIDDEN_SCREEN_OPTIONS = {
  href: null,
  tabBarStyle: { display: 'none' },
} as const;

export default function AppTabsLayout() {
  const { isLoading, session } = useSession();
  // G6.1: header navigator tắt toàn bộ — header duy nhất là Paper Appbar
  // từng màn. G7: tab bar ăn theme hiệu lực (light/dark/system của user).
  const { theme } = useThemeMode();

  if (isLoading) {
    return <LoadingState message="Đang kiểm tra phiên đăng nhập…" />;
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Tabs
      initialRouteName="dashboard"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: { backgroundColor: theme.colors.surface },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarAccessibilityLabel: 'Trang chủ, lưới 6 chức năng',
          tabBarIcon: ({ color, size }) => (
            <TabIcon color={color} name={TAB_BAR_ICONS.home} size={size} />
          ),
          title: 'Trang chủ',
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          tabBarAccessibilityLabel: 'Tài liệu học tập',
          tabBarIcon: ({ color, size }) => (
            <TabIcon
              color={color}
              name={TAB_BAR_ICONS.documents}
              size={size}
            />
          ),
          title: 'Tài liệu',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarAccessibilityLabel: 'Tài khoản của tôi',
          tabBarIcon: ({ color, size }) => (
            <TabIcon color={color} name={TAB_BAR_ICONS.profile} size={size} />
          ),
          title: 'Tài khoản',
        }}
      />
      <Tabs.Screen name="notes" options={HIDDEN_SCREEN_OPTIONS} />
      <Tabs.Screen name="notes/new" options={HIDDEN_SCREEN_OPTIONS} />
      <Tabs.Screen name="notes/[id]" options={HIDDEN_SCREEN_OPTIONS} />
      <Tabs.Screen name="documents/upload" options={HIDDEN_SCREEN_OPTIONS} />
      <Tabs.Screen name="documents/[id]" options={HIDDEN_SCREEN_OPTIONS} />
      <Tabs.Screen name="subjects" options={HIDDEN_SCREEN_OPTIONS} />
      <Tabs.Screen name="scan" options={HIDDEN_SCREEN_OPTIONS} />
      <Tabs.Screen
        name="profile/change-password"
        options={HIDDEN_SCREEN_OPTIONS}
      />
    </Tabs>
  );
}
