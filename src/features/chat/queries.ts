import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import type { ConversationTurn } from '../../shared/ai/transport';
import type { DocumentQuestionRow } from '../../shared/types/database';

import {
  askQuestion,
  listQuestions,
  saveConversation,
  type ChatDocument,
} from './api';

/** Lịch sử hỏi đáp của một tài liệu. */
export function questionsKey(documentId: string) {
  return ['questions', documentId] as const;
}

/** Lịch sử hỏi đáp (mới nhất trước), null khi chưa hỏi gì. */
export function useQuestions(
  userId: string | undefined,
  documentId: string | undefined,
  enabled = true,
) {
  return useQuery({
    enabled: Boolean(userId) && Boolean(documentId) && enabled,
    queryFn: () =>
      listQuestions({
        documentId: documentId as string,
        userId: userId as string,
      }),
    queryKey: documentId ? questionsKey(documentId) : ['questions', 'anonymous'],
  });
}

/**
 * Mutation "hỏi trên tài liệu". Xong thì invalidate đúng key lịch sử
 * của tài liệu đó; không invalidate toàn bộ cache.
 */
export function useAskQuestion(userId: string) {
  return useMutation({ mutationFn: (input: { document: ChatDocument; question: string; history?: ConversationTurn[] }) => askQuestion({ ...input, userId }) });
}

export function useSaveConversation(userId: string, documentId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { conversationId: string; turns: DocumentQuestionRow[] }) => saveConversation({ ...input, userId, documentId }),
    onSuccess: () => { void client.invalidateQueries({ queryKey: questionsKey(documentId) }); },
  });
}
