import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, Linking, StyleSheet, View } from 'react-native';
import { Banner, Button, Card, Text, useTheme } from 'react-native-paper';

import { useSession } from '../../src/features/auth/useSession';
import { reclaimStaleScan, recoverPendingScanImage, type ScanPickOutcome } from '../../src/features/scan/api';
import { isScanQuotaError, ScanTruncatedError, toScanErrorMessage } from '../../src/features/scan/errors';
import { useCaptureScanImage, useLatestScan, usePickScanImage, useRunScan } from '../../src/features/scan/queries';
import { ScanTextEditor } from '../../src/features/scan/scan-text-editor';
import type { ScanImage } from '../../src/features/scan/schemas';
import { getScanViewState } from '../../src/features/scan/viewState';
import { ListSkeleton } from '../../src/shared/components/LoadingState';
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
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [showLatest, setShowLatest] = useState(true);
  const [previewVisible, setPreviewVisible] = useState(false);
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
    setPreviewVisible(false);
    setShowLatest(false);
    setDocumentId(null);
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
      setDocumentId(result.document.id);
    } catch (reason) {
      if (reason instanceof ScanTruncatedError) { setText(reason.extractedText); setDocumentId(reason.documentId ?? null); }
      setQuota(isScanQuotaError(reason));
      setError(toScanErrorMessage(reason));
    } finally {
      scanLock.current = false;
    }
  };

  const resultText = text ?? (showLatest && latestDocument?.extraction_status === 'done'
    ? latestDocument.extracted_text : null);
  const resultDocumentId = documentId ?? (showLatest ? latestDocument?.id : null);
  const latestError = showLatest && latestDocument?.extraction_status === 'failed'
    ? 'Lần quét trước thất bại. Hãy chọn hoặc chụp ảnh rồi thử lại.' : null;
  const view = getScanViewState({
    error: error ?? latestError ?? (latest.isError ? 'Không tải được kết quả quét.' : null),
    isProcessing: scanMutation.isPending || (showLatest && latestDocument?.extraction_status === 'processing'),
    text: resultText,
  });

  const hasResult = Boolean(resultText && resultDocumentId);
  const processing = view === 'processing';
  const showPreview = Boolean(image && (!hasResult || previewVisible));

  return (
    <ScreenContainer contentStyle={styles.content}
      header={<ScreenHeader onBack={() => goBackOrReplace(router, '/dashboard')} showBack title="Quét đề bài" />}>
      <View style={styles.intro}>
        <Text variant="headlineSmall">{hasResult ? '3. Kiểm tra nội dung' : image || processing ? '2. Đọc đề từ ảnh' : '1. Thêm ảnh đề bài'}</Text>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>
          {hasResult ? 'Sửa lại chữ hoặc công thức nếu cần, rồi tiếp tục học với AI.'
            : image ? 'Kiểm tra ảnh rõ chữ trước khi đọc. Mỗi lần xử lý một đề bài.'
            : 'Chụp rõ đề, đủ sáng và không mất góc. Ảnh tối đa 10 MB.'}
        </Text>
      </View>

      {hasResult && resultText && resultDocumentId ? <Card mode="outlined">
        <Card.Content style={styles.editor}>
          <ScanTextEditor key={resultDocumentId} documentId={resultDocumentId} userId={userId} initialText={resultText} />
        </Card.Content>
      </Card> : null}

      {hasResult && image ? <Button contentStyle={styles.touchTarget} onPress={() => setPreviewVisible(!previewVisible)} testID="scan-preview-toggle">
        {previewVisible ? 'Thu gọn ảnh gốc' : 'Xem ảnh gốc'}
      </Button> : null}
      {showPreview && image ? <Card mode="outlined">
        <Card.Content style={styles.previewWrap}>
          <Image accessibilityLabel="Ảnh đề bài đã chọn" resizeMode="contain" source={{ uri: image.uri }} style={styles.preview} />
        </Card.Content>
      </Card> : null}

      {image && (!hasResult || previewVisible) ? <Button contentStyle={styles.touchTarget} disabled={busy || processing}
        icon={AppIcons.textBoxOutline} loading={scanMutation.isPending} mode="contained"
        onPress={() => void run()} testID="scan-run">
        {processing ? 'Đang đọc đề…' : hasResult ? 'Đọc lại từ ảnh' : 'Đọc đề bài'}
      </Button> : null}

      {processing ? <View style={styles.intro}>
        <Text accessibilityLiveRegion="polite">AI đang đọc chữ và công thức. Vui lòng giữ màn hình mở.</Text>
        <ListSkeleton rows={2} />
      </View> : showLatest && latest.isPending && !image ? <ListSkeleton rows={2} /> : null}

      {quota ? <Banner icon={AppIcons.alertCircle} visible>Đã chạm hạn mức AI. Hãy thử lại sau.</Banner> : null}
      {openSettings ? <Button contentStyle={styles.touchTarget} icon={AppIcons.openInNew} onPress={() => void Linking.openSettings()}>Mở Cài đặt</Button> : null}
      {view === 'error' ? <View style={styles.intro}>
        <Text accessibilityLiveRegion="polite" style={{ color: theme.colors.error }}>{error ?? latestError ?? 'Không tải được kết quả quét.'}</Text>
        {resultText && !resultDocumentId ? <Text selectable>{resultText}</Text> : null}
        {!quota ? <Button contentStyle={styles.touchTarget} icon={AppIcons.refresh} mode="outlined"
          onPress={() => { if (image) void run(); else if (latest.isError) void latest.refetch(); else void pick(); }} testID="scan-retry">Thử lại</Button> : null}
      </View> : null}

      <View style={styles.actions}>
        <Button contentStyle={styles.touchTarget} disabled={busy} icon={AppIcons.camera} mode={!image && !hasResult ? 'contained' : 'text'}
          onPress={() => void capture()} testID="scan-capture">{image || hasResult ? 'Chụp ảnh khác' : 'Chụp đề bài'}</Button>
        <Button contentStyle={styles.touchTarget} disabled={busy} icon={AppIcons.imageOutline} mode={!image && !hasResult ? 'outlined' : 'text'}
          onPress={() => void pick()} testID="scan-pick">{image || hasResult ? 'Chọn ảnh khác' : 'Chọn từ thư viện'}</Button>
      </View>
      {!image && !hasResult ? <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        Thêm ảnh → đọc đề → kiểm tra → học cùng AI
      </Text> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  touchTarget: { minHeight: spacing.xl * 2 },
  actions: { gap: spacing.sm },
  content: { justifyContent: 'flex-start', gap: spacing.lg },
  intro: { gap: spacing.sm },
  editor: { paddingTop: spacing.lg },
  preview: { height: spacing.xxl * 8, width: '100%' },
  previewWrap: { padding: spacing.sm },
});
