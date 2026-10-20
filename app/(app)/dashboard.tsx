import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Appbar, Button, Card, Divider, Icon, List, Text, useTheme } from 'react-native-paper';

import { ScreenContainer } from '../../src/shared/components/ScreenContainer';
import { ThemeToggleAction } from '../../src/shared/components/ThemeToggleAction';
import { FEATURE_STATUS, type FeatureId } from '../../src/shared/config/featureStatus';
import { AppIcons } from '../../src/shared/theme/icons';
import { spacing } from '../../src/shared/theme/spacing';
import type { AppTheme } from '../../src/shared/theme/theme';

export default function DashboardScreen() {
  const theme = useTheme<AppTheme>();
  const openFeature = (id: FeatureId) => {
    const feature = FEATURE_STATUS[id];
    if (feature.route && feature.status !== 'soon') router.push(feature.route);
  };

  return <ScreenContainer contentStyle={styles.content} header={<Appbar.Header>
    <Appbar.Content title="Trợ lý học tập" />
    <ThemeToggleAction />
  </Appbar.Header>}>
    <View style={styles.intro}>
      <Text variant="headlineMedium">Bạn muốn học từ đâu?</Text>
      <Text style={{ color: theme.colors.onSurfaceVariant }} variant="bodyLarge">
        Thêm tài liệu hoặc một ảnh đề bài. AI giúp bạn hiểu và học từng bước.
      </Text>
    </View>

    <Card mode="contained" style={{ backgroundColor: theme.colors.primaryContainer }}>
      <Card.Content style={styles.start}>
        <Icon source={AppIcons.notebookOutline} color={theme.colors.onPrimaryContainer} size={32} />
        <Text style={{ color: theme.colors.onPrimaryContainer }} variant="titleLarge">Bắt đầu buổi học</Text>
        <Button contentStyle={styles.touchTarget} icon={AppIcons.upload} mode="contained" onPress={() => router.push('/documents/upload')} testID="home-upload">Tải tài liệu</Button>
        <Button contentStyle={styles.touchTarget} icon={AppIcons.camera} mode="outlined" onPress={() => openFeature('5')} testID="home-scan">Quét đề bài</Button>
        <Text style={{ color: theme.colors.onPrimaryContainer }} variant="bodySmall">Tải tệp → chọn cách học → xem lại khi cần.</Text>
      </Card.Content>
    </Card>

    <Card mode="outlined" onPress={() => openFeature('2')} accessibilityRole="button" accessibilityLabel="Mở tài liệu của tôi" testID="home-library">
      <Card.Title title="Tài liệu của tôi" subtitle="Tóm tắt · Hỏi đáp · Giải bài"
        left={(props) => <List.Icon {...props} icon={AppIcons.fileDocumentOutline} />}
        right={(props) => <List.Icon {...props} icon={AppIcons.chevronRight} />} />
    </Card>

    <View>
      <List.Item title="Ghi chú học tập" description="Giữ lại điều bạn muốn nhớ" onPress={() => openFeature('1')}
        left={(props) => <List.Icon {...props} icon={AppIcons.noteTextOutline} />}
        right={(props) => <List.Icon {...props} icon={AppIcons.chevronRight} />} testID="home-notes" />
      <Divider />
      <List.Item title="Môn học & chủ đề" description="Sắp xếp tài liệu để tìm lại dễ hơn" onPress={() => router.push('/subjects')}
        left={(props) => <List.Icon {...props} icon={AppIcons.folderOutline} />}
        right={(props) => <List.Icon {...props} icon={AppIcons.chevronRight} />} testID="home-subjects" />
    </View>
  </ScreenContainer>;
}
const styles = StyleSheet.create({
  touchTarget: { minHeight: spacing.xl * 2 },
  content: { justifyContent: 'flex-start', gap: spacing.xl },
  intro: { gap: spacing.sm },
  start: { gap: spacing.md, paddingVertical: spacing.xl },
});
