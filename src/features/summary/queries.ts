import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import type { SummarySource, SummaryOptions } from '../../shared/ai/transport';
import {
  getSummary,
  listSummaries,
  requestSummary,
  type SummaryDocument,
} from './api';

export function summaryKey(documentId: string) {
  return ['summary', documentId] as const;
}

export function documentDetailKey(documentId: string) {
  return ['document', documentId] as const;
}

export function useSummary(
  userId: string | undefined,
  documentId: string | undefined,
) {
  return useQuery({
    enabled: Boolean(userId) && Boolean(documentId),
    queryFn: () =>
      getSummary({
        documentId: documentId as string,
        userId: userId as string,
      }),
    queryKey: documentId ? summaryKey(documentId) : ['summary', 'anonymous'],
  });
}

export function useRequestSummary(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { document: SummaryDocument; source: SummarySource; options?: SummaryOptions }) =>
      requestSummary({ ...input, userId }),
    onError: (_error, variables) => {
      // Lỗi vẫn lật DB về `failed` nên cache trạng thái phải refresh
      // để UI hiện nút “Thử lại” thay vì kẹt spinner.
      void queryClient.invalidateQueries({ queryKey: ['summary-history', variables.document.id] });
      void queryClient.invalidateQueries({
        queryKey: summaryKey(variables.document.id),
      });
      void queryClient.invalidateQueries({
        queryKey: documentDetailKey(variables.document.id),
      });
      void queryClient.invalidateQueries({
        queryKey: ['documents', userId],
      });
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['summary-history', variables.document.id] });
      void queryClient.invalidateQueries({
        queryKey: summaryKey(variables.document.id),
      });
      void queryClient.invalidateQueries({
        queryKey: documentDetailKey(variables.document.id),
      });
      void queryClient.invalidateQueries({
        queryKey: ['documents', userId],
      });
    },
  });
}

export function useSummaryHistory(userId: string, documentId: string) {
  return useQuery({ queryKey: ['summary-history', documentId],
    enabled: Boolean(userId && documentId),
    queryFn: () => listSummaries({ userId, documentId }),
  });
}
