import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Banner,
  Button,
  Card,
  List,
  Text,
  useTheme,
} from 'react-native-paper';

import { EmptyState } from '../../../src/shared/components/EmptyState';
import { FormTextInput } from '../../../src/shared/components/FormTextInput';
import { ListSkeleton } from '../../../src/shared/components/LoadingState';
import type { DocumentWithSubject } from '../../../src/features/documents/api';
import {
  ChatGuardError,
  isChatQuotaError,
  toChatErrorMessage,
} from '../../../src/features/chat/errors';
import type { ChatDocument } from '../../../src/features/chat/api';
import {
  useAskQuestion,
  useQuestions,
} from '../../../src/features/chat/queries';
import { spacing } from '../../../src/shared/theme/spacing';
import { AppIcons } from '../../../src/shared/theme/icons';
import type { AppTheme } from '../../../src/shared/theme/theme';

function toChatDocument(doc: DocumentWithSubject): ChatDocument {
  return {
    extracted_text: doc.extracted_text,
    extraction_status: doc.extraction_status,
    file_ext: doc.file_ext,
    id: doc.id,
    user_id: doc.user_id,
  };
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Không rõ';
  }
  return date.toLocaleString('vi-VN');
}

/**
 * Vùng hỏi đáp CN4 trên cùng màn chi tiết (FR-23 → FR-30).
 * CẤM vector DB/RAG/chunking: toàn văn `extracted_text` nhồi thẳng vào
 * prompt trong một request. Khi `extracted_text` có nội dung thì hỏi đáp
 * được trên PDF y như TXT (FR-13: PDF trích toàn văn ở CN3); TXT giữ
 * nguyên hành vi cũ. Chưa có `extracted_text` → chặn hỏi, bảo
 * user tóm tắt trước. Lịch sử append-only, mới nhất trước; lượt hỏi
 * lỗi không tạo row. Lỗi 429/5xx → thông điệp riêng + nút thử lại
 * (riêng 429/quota → banner hạn mức, CẤM retry).
 */
export function QaSection({
  doc,
  userId,
}: {
  doc: DocumentWithSubject;
  userId: string;
}) {
  const theme = useTheme<AppTheme>();
  const hasContext = (doc.extracted_text?.trim() ?? '').length > 0;
  const questionsQuery = useQuestions(userId, doc.id, hasContext);
  const askMutation = useAskQuestion(userId, doc.id);

  const [question, setQuestion] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [askError, setAskError] = useState<string | null>(null);

  const asking = askMutation.isPending;
  const isQuotaError =
    askMutation.error != null && isChatQuotaError(askMutation.error);

  const handleAsk = () => {
    if (asking) {
      return;
    }
    setFieldError(null);
    setAskError(null);
    askMutation.mutate(
      { document: toChatDocument(doc), question },
      {
        onError: (error: unknown) => {
          const message = toChatErrorMessage(error);
          if (
            error instanceof ChatGuardError &&
            /nhập câu hỏi|500 ký tự/.test(message)
          ) {
            setFieldError(message);
          } else {
            setAskError(message);
          }
        },
        onSuccess: () => {
          setQuestion('');
        },
      },
    );
  };

  return (
    <Card mode="outlined">
      <Card.Title
        left={(props) => (
          <List.Icon {...props} icon={AppIcons.messageTextOutline} />
        )}
        subtitle="Trả lời dựa trên nội dung tài liệu"
        title="Hỏi đáp với AI"
      />
      <Card.Content style={styles.content}>
        {!hasContext ? (
          <EmptyState
            description="Hãy bấm “Tóm tắt bằng AI” ở trên để có nội dung hỏi đáp. Khi tài liệu đã có nội dung trích xuất (TXT sau tóm tắt, PDF sau trích xuất toàn văn), hỏi đáp dùng được y như nhau."
            icon={AppIcons.messageTextOutline}
            title="Chưa thể hỏi đáp"
          />
        ) : (
          <View style={styles.content}>
            <FormTextInput
              accessibilityLabel="Câu hỏi về tài liệu"
              fieldError={fieldError ?? undefined}
              label="Câu hỏi về tài liệu (tối đa 500 ký tự)"
              leftIcon={AppIcons.messageTextOutline}
              multiline
              numberOfLines={3}
              onChangeText={(text) => {
                setQuestion(text);
                setFieldError(null);
              }}
              testID="qa-input"
              value={question}
            />
            <Button
              accessibilityLabel="Gửi câu hỏi cho AI"
              disabled={asking}
              icon={AppIcons.send}
              loading={asking}
              mode="contained"
              onPress={handleAsk}
              testID="qa-submit"
            >
              Hỏi
            </Button>
            {isQuotaError ? (
              <Banner icon={AppIcons.alertCircle} visible>
                <Text style={{ color: theme.colors.error }}>
                  {toChatErrorMessage(askMutation.error)}
                </Text>
              </Banner>
            ) : askError !== null ? (
              <View style={styles.content}>
                <Text
                  style={{ color: theme.colors.error }}
                  variant="bodyMedium"
                >
                  {askError}
                </Text>
                <Button
                  accessibilityLabel="Hỏi lại câu vừa rồi"
                  disabled={asking}
                  icon={AppIcons.refresh}
                  mode="outlined"
                  onPress={handleAsk}
                  testID="qa-retry"
                >
                  Thử lại
                </Button>
              </View>
            ) : null}

            <Text variant="titleSmall">Lịch sử hỏi đáp</Text>
            {questionsQuery.isPending ? (
              <ListSkeleton rows={2} />
            ) : questionsQuery.isError ? (
              <EmptyState
                actionLabel="Thử lại"
                actionTestID="questions-retry"
                description={toChatErrorMessage(questionsQuery.error)}
                icon={AppIcons.alertCircle}
                onAction={() => {
                  void questionsQuery.refetch();
                }}
                title="Không tải được lịch sử hỏi đáp"
              />
            ) : (questionsQuery.data ?? []).length === 0 ? (
              <EmptyState
                description="Hãy đặt câu hỏi đầu tiên về tài liệu."
                icon={AppIcons.messageTextOutline}
                title="Chưa có câu hỏi nào"
              />
            ) : (
              <View style={styles.content}>
                {(questionsQuery.data ?? []).map((row) => (
                  <Card key={row.id} mode="outlined">
                    <Card.Content style={styles.content}>
                      <Text variant="titleSmall">Hỏi: {row.question}</Text>
                      <Text variant="bodyMedium">{row.answer}</Text>
                      <Text
                        style={{ color: theme.colors.onSurfaceVariant }}
                        variant="bodySmall"
                      >
                        {formatDateTime(row.created_at)}
                      </Text>
                    </Card.Content>
                  </Card>
                ))}
              </View>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
  },
});
