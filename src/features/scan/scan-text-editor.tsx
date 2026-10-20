import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { FormTextInput } from '../../shared/components/FormTextInput';
import { spacing } from '../../shared/theme/spacing';
import type { AppTheme } from '../../shared/theme/theme';
import { toScanErrorMessage } from './errors';
import { useSaveScanText } from './queries';

/** Dùng tại màn quét và chi tiết ảnh; luôn lưu bản đã kiểm tra trước khi mở AI. */
export function ScanTextEditor({ documentId, userId, initialText }: {
  documentId: string; userId: string; initialText: string;
}) {
  const theme = useTheme<AppTheme>();
  const [text, setText] = useState(initialText);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const mutation = useSaveScanText(userId);
  const save = async (openAnalysis: boolean) => {
    if (mutation.isPending || lock.current) return;
    lock.current = true;
    setError(null); setMessage(null);
    try {
      await mutation.mutateAsync({ documentId, text });
      setMessage('Đã lưu nội dung đã kiểm tra.');
      if (openAnalysis) router.push({ pathname: '/documents/[id]', params: { id: documentId, analyze: String(Date.now()) } });
    } catch (reason) { setError(toScanErrorMessage(reason)); }
    finally { lock.current = false; }
  };
  return <View style={{ gap: spacing.sm }}>
    <FormTextInput label="Nội dung đề bài" value={text} onChangeText={setText}
      multiline numberOfLines={6} disabled={mutation.isPending} testID="scan-edit-text" />
    <Button contentStyle={{ minHeight: spacing.xl * 2 }} disabled={mutation.isPending || !text.trim()} loading={mutation.isPending} mode="contained"
      onPress={() => void save(true)} testID="scan-analyze">Tiếp tục với AI</Button>
    <Button contentStyle={{ minHeight: spacing.xl * 2 }} disabled={mutation.isPending || !text.trim()} onPress={() => void save(false)} testID="scan-save-text">Lưu nội dung</Button>
    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Nội dung được lưu trước khi AI phân tích.</Text>
    {error ? <Text style={{ color: theme.colors.error }}>{error}</Text> : message ? <Text accessibilityLiveRegion="polite">{message}</Text> : null}
  </View>;
}
