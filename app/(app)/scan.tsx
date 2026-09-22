import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, Linking, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Banner, Button, Card, Text, useTheme } from 'react-native-paper';

import { useSession } from '../../src/features/auth/useSession';
import { reclaimStaleScan, recoverPendingScanImage, type ScanPickOutcome } from '../../src/features/scan/api';
import { isScanQuotaError, ScanTruncatedError, toScanErrorMessage } from '../../src/features/scan/errors';
import { useCaptureScanImage, useLatestScan, usePickScanImage, useRunScan } from '../../src/features/scan/queries';
import type { ScanImage } from '../../src/features/scan/schemas';
import { getScanViewState } from '../../src/features/scan/viewState';
import { EmptyState } from '../../src/shared/components/EmptyState';
import { ScreenContainer } from '../../src/shared/components/ScreenContainer';
import { ScreenHeader } from '../../src/shared/components/ScreenHeader';
import { goBackOrReplace } from '../../src/shared/lib/navigation';
import { AppIcons } from '../../src/shared/theme/icons';
import { spacing } from '../../src/shared/theme/spacing';
import type { AppTheme } from '../../src/shared/theme/theme';

export default function ScanScreen() {
  const theme = useTheme<AppTheme>();
  const { user } = useSession();
  const userId = user?.id ?? '';
  const pickMutation = usePickScanImage();
  const cameraMutation = useCaptureScanImage();
  const scanMutation = useRunScan(userId);
  const latest = useLatestScan(user?.id);
  const [image, setImage] = useState<ScanImage | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [showLatest, setShowLatest] = useState(true);
  const scanLock = useRef(false);
  const staleCheckedId = useRef<string | null>(null);

  const busy = pickMutation.isPending || cameraMutation.isPending || scanMutation.isPending;
  const latestDocument = latest.data;

  useEffect(() => {
    let active = true;
    recoverPendingScanImage()
      .then((outcome) => {
        if (active && outcome?.status === 'ready') {
          setImage(outcome.image);
          setShowLatest(false);
          setError(null);
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(toScanErrorMessage(reason));
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!latestDocument || !user || staleCheckedId.current === latestDocument.id) return;
    staleCheckedId.current = latestDocument.id;
    reclaimStaleScan(latestDocument, user.id)
      .then((reclaimed) => { if (reclaimed) void latest.refetch(); })
      .catch((reason: unknown) => setError(toScanErrorMessage(reason)));
  }, [latestDocument, latest, user]);

  const acceptOutcome = (outcome: ScanPickOutcome) => {
    if (outcome.status === 'cancelled') return;
    if (outcome.status === 'denied') {
      setOpenSettings(!outcome.canAskAgain);
      setError(outcome.canAskAgain
        ? 'Cần cấp quyền camera để chụp đề bài. Hãy thử lại.'
        : 'Quyền camera đã bị từ chối. Hãy mở Cài đặt để cấp quyền.');
      return;
    }
    setImage(outcome.image);
    setShowLatest(false);
    setText(null);
    setError(null);
    setQuota(false);
    setOpenSettings(false);
  };

  const pick = async () => {
    if (busy || scanLock.current) return;
    try { acceptOutcome(await pickMutation.mutateAsync()); }
    catch (reason) { setError(toScanErrorMessage(reason)); }
  };

  const capture = async () => {
    if (busy || scanLock.current) return;
    try { acceptOutcome(await cameraMutation.mutateAsync()); }
    catch (reason) { setError(toScanErrorMessage(reason)); }
  };

  const run = async () => {
    if (!image || !user || busy || scanLock.current) return;
    scanLock.current = true;
    setError(null);
    setQuota(false);
    setText(null);
    try {
      const result = await scanMutation.mutateAsync(image);
      setText(result.extractedText);
    } catch (reason) {
      if (reason instanceof ScanTruncatedError) setText(reason.extractedText);
      setQuota(isScanQuotaError(reason));
      setError(toScanErrorMessage(reason));
    } finally {
      scanLock.current = false;
    }
  };

  const resultText = text ?? (showLatest && latestDocument?.extraction_status === 'done'
    ? latestDocument.extracted_text : null);
  const latestError = showLatest && latestDocument?.extraction_status === 'failed'
    ? 'Lần quét trước thất bại. Hãy chọn hoặc chụp ảnh rồi thử lại.' : null;
  const view = getScanViewState({
    error: error ?? latestError ?? (latest.isError ? 'Không tải được kết quả quét.' : null),
    isProcessing: scanMutation.isPending || (showLatest && latestDocument?.extraction_status === 'processing'),
    text: resultText,
  });

  return (
    <ScreenContainer header={<ScreenHeader onBack={() => goBackOrReplace(router, '/dashboard')} showBack title="Quét đề bài" />}>
      <Text variant="bodyMedium">Chọn hoặc chụp một ảnh đề bài (tối đa 10 MB), xem trước rồi bấm Quét.</Text>

      {image ? (
        <Card mode="outlined">
          <Card.Content style={styles.previewWrap}>
            <Image accessibilityLabel="Ảnh đề bài đã chọn" resizeMode="contain" source={{ uri: image.uri }} style={styles.preview} />
          </Card.Content>
        </Card>
      ) : null}

      <View style={styles.actions}>
        <Button disabled={busy} icon={AppIcons.imageOutline} mode="outlined" onPress={() => void pick()} testID="scan-pick">Chọn ảnh</Button>
        <Button disabled={busy} icon={AppIcons.camera} mode="outlined" onPress={() => void capture()} testID="scan-capture">Chụp ảnh</Button>
        <Button disabled={!image || busy} icon={AppIcons.textBoxOutline} loading={scanMutation.isPending} mode="contained" onPress={() => void run()} testID="scan-run">Quét</Button>
      </View>

      {quota ? <Banner icon={AppIcons.alertCircle} visible>Đã chạm hạn mức AI. Hãy thử lại sau.</Banner> : null}
      {openSettings ? <Button icon={AppIcons.openInNew} onPress={() => void Linking.openSettings()}>Mở Cài đặt</Button> : null}

      {view === 'processing' ? (
        <View style={styles.center}>
          <ActivityIndicator accessibilityLabel="Đang quét ảnh" size="large" />
          <Text>Đang đọc chữ trong ảnh…</Text>
        </View>
      ) : null}
      {view === 'result' ? (
        <Card mode="outlined">
          <Card.Title title="Văn bản đã quét" />
          <Card.Content><Text selectable variant="bodyMedium">{resultText}</Text></Card.Content>
        </Card>
      ) : null}
      {view === 'empty' ? <EmptyState description="Chọn hoặc chụp ảnh đề bài để bắt đầu." icon={AppIcons.imageOutline} title="Chưa có kết quả" /> : null}
      {view === 'error' ? (
        <View style={styles.center}>
          <Text style={{ color: theme.colors.error }}>{error ?? latestError ?? 'Không tải được kết quả quét.'}</Text>
          {resultText ? <Text selectable>{resultText}</Text> : null}
          {!quota ? <Button icon={AppIcons.refresh} mode="outlined" onPress={() => { if (image) void run(); else void pick(); }} testID="scan-retry">Thử lại</Button> : null}
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.sm },
  center: { alignItems: 'center', gap: spacing.md, padding: spacing.md },
  preview: { height: 260, width: '100%' },
  previewWrap: { padding: spacing.sm },
});
