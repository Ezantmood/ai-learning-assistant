import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Banner, Button, Card, List, Text, useTheme } from 'react-native-paper';

import { ScreenContainer } from '../../../src/shared/components/ScreenContainer';
import { ScreenHeader } from '../../../src/shared/components/ScreenHeader';
import { goBackOrReplace } from '../../../src/shared/lib/navigation';
import { useSession } from '../../../src/features/auth/useSession';
import {
  pickDocument,
  type PickedDocumentAsset,
} from '../../../src/features/documents/api';
import {
  getDocumentsErrorCode,
  toDocumentsErrorMessage,
} from '../../../src/features/documents/errors';
import { useUploadDocument } from '../../../src/features/documents/queries';
import { formatFileSize } from '../../../src/features/documents/storage';
import { spacing } from '../../../src/shared/theme/spacing';
import type { AppTheme } from '../../../src/shared/theme/theme';

export default function UploadDocumentScreen() {
  const theme = useTheme<AppTheme>();
  const { user } = useSession();
  const [picked, setPicked] = useState<PickedDocumentAsset | null>(null);
  const [picking, setPicking] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiErrorCode, setApiErrorCode] = useState<string | null>(null);

  const mutation = useUploadDocument(user?.id ?? '');

  const busy = picking || mutation.isPending;

  /** CẤM nuốt im lặng: log nguyên error object để chẩn đoán. */
  const reportError = (error: unknown) => {
    if (__DEV__) {
      console.error('[documents] upload error:', error);
    }
    setApiError(toDocumentsErrorMessage(error));
    setApiErrorCode(getDocumentsErrorCode(error));
  };

  const handlePick = () => {
    if (busy) {
      return;
    }
    setPicking(true);
    setApiError(null);
    setApiErrorCode(null);
    pickDocument()
      .then((asset) => {
        // Hủy picker thì im lặng, giữ nguyên màn hình.
        if (asset) {
          setPicked(asset);
        }
      })
      .catch((error: unknown) => {
        reportError(error);
      })
      .finally(() => {
        setPicking(false);
      });
  };

  const handleUpload = () => {
    if (!user || !picked || mutation.isPending) {
      return;
    }
    setApiError(null);
    setApiErrorCode(null);
    mutation.mutate(picked, {
      onError: (error: unknown) => {
        // Giữ tệp đã chọn để thử lại khi lỗi mạng/giới hạn.
        reportError(error);
      },
      onSuccess: () => {
        router.replace({ params: { uploaded: '1' }, pathname: '/documents' });
      },
    });
  };

  return (
    <ScreenContainer
      header={
        <ScreenHeader
          onBack={() => goBackOrReplace(router, '/documents')}
          showBack
          title="Tải tài liệu lên"
        />
      }
    >
      <Text variant="bodyMedium">
        Chọn tệp PDF, DOCX hoặc TXT (tối đa 10 MB). Tệp được kiểm tra trước
        khi tải lên.
      </Text>

      {apiError ? (
        <Banner icon="alert-circle" visible>
          {apiError}
          {__DEV__ && apiErrorCode ? (
            <Text style={[styles.devCode, { color: theme.colors.error }]}>
              {apiErrorCode}
            </Text>
          ) : null}
        </Banner>
      ) : null}

      {picked ? (
        <Card mode="outlined">
          <Card.Title
            left={(props) => <List.Icon {...props} icon="file-document-outline" />}
            subtitle={`${picked.mimeType ?? 'Không rõ loại'} • ${
              picked.size != null ? formatFileSize(picked.size) : 'Không rõ dung lượng'
            }`}
            title={picked.name}
            titleNumberOfLines={2}
          />
        </Card>
      ) : null}

      <View style={styles.actions}>
        <Button
          accessibilityLabel="Chọn tệp tài liệu"
          disabled={busy}
          icon="file-document-outline"
          loading={picking}
          mode="outlined"
          onPress={handlePick}
          testID="documents-pick"
        >
          {picked ? 'Chọn tệp khác' : 'Chọn tệp'}
        </Button>

        <Button
          accessibilityLabel="Tải lên tài liệu đã chọn"
          disabled={!picked || busy}
          icon="upload"
          loading={mutation.isPending}
          mode="contained"
          onPress={handleUpload}
          testID="documents-upload"
        >
          Tải lên
        </Button>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
  },
  devCode: {
    marginTop: spacing.xs,
  },
});
