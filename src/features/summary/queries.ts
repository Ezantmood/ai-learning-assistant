import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import type { SummarySource } from '../../lib/ai/transport';
import {
  getSummary,
  requestSummary,
  type SummaryDocument,
} from './api';

/** Bản tóm tắt của một tài liệu. */
export function summaryKey(documentId: string) {
  return ['summary', documentId] as const;
}

/**
 * Key trạng thái trích xuất của màn chi tiết CN2. Dựng literal cùng hình
 * dạng với `documentKey` của feature documents để invalidate — KHÔNG
 * import chéo từ feature documents (cấm theo AGENTS.md).
 */
export function documentDetailKey(documentId: string) {
  return ['document', documentId] as const;
}

/** FR-18 (dữ liệu): đọc bản tóm tắt mới nhất, null khi chưa có. */
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

/**
 * FR-14: mutation "tóm tắt tài liệu". G2 truyền `source` (nội dung tệp đã
 * tải: PDF base64 / TXT text). Xong thì invalidate key tóm tắt + key chi
 * tiết tài liệu + danh sách tài liệu của user; không invalidate toàn cache.
 */
export function useRequestSummary(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { document: SummaryDocument; source: SummarySource }) =>
      requestSummary({ ...input, userId }),
    onError: (_error, variables) => {
      // Lỗi vẫn lật DB về `failed` nên cache trạng thái phải refresh
      // để UI hiện nút “Thử lại” thay vì kẹt spinner.
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
