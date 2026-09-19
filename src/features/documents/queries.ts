import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  listDocuments,
  uploadDocument,
  type PickedDocumentAsset,
} from './api';

export function documentsKey(userId: string) {
  return ['documents', userId] as const;
}

export function useDocuments(userId: string | undefined) {
  return useQuery({
    enabled: Boolean(userId),
    queryFn: () => listDocuments(userId as string),
    queryKey: userId ? documentsKey(userId) : ['documents', 'anonymous'],
  });
}

export function useUploadDocument(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (asset: PickedDocumentAsset) =>
      uploadDocument({ asset, userId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: documentsKey(userId) });
    },
  });
}
