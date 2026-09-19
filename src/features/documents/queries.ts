import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  assignDocumentSubject,
  countDocumentsInSubject,
  createSubject,
  deleteDocument,
  deleteSubject,
  getDocument,
  getDocumentUrl,
  listDocuments,
  listSubjects,
  renameDocument,
  renameSubject,
  uploadDocument,
  type DocumentWithSubject,
  type PickedDocumentAsset,
} from './api';
import type { SubjectFilterValue } from './storage';

export function documentsKey(userId: string) {
  return ['documents', userId] as const;
}

export function subjectsKey(userId: string) {
  return ['subjects', userId] as const;
}

export function documentKey(documentId: string) {
  return ['document', documentId] as const;
}

export function documentUrlKey(storagePath: string) {
  return ['document-url', storagePath] as const;
}

/** Cache signed URL ngắn hơn TTL 3600s (giống avatar CN1: 55 phút). */
export const DOCUMENT_URL_STALE_MS = 55 * 60 * 1000;

export type DocumentsFilter = {
  /** Chuỗi ô tìm kiếm (ilike server-side, debounce ở screen). */
  search: string;
  /** undefined = tất cả, null = chưa phân loại, string = id môn. */
  subjectFilter: SubjectFilterValue;
};

export function useDocuments(
  userId: string | undefined,
  filter?: DocumentsFilter,
) {
  const search = filter?.search ?? '';
  const subjectFilter = filter?.subjectFilter;
  return useQuery({
    enabled: Boolean(userId),
    queryFn: () =>
      listDocuments(userId as string, { search, subjectFilter }),
    queryKey: userId
      ? [...documentsKey(userId), { search, subjectFilter }]
      : ['documents', 'anonymous'],
  });
}

export function useDocument(
  userId: string | undefined,
  documentId: string | undefined,
) {
  return useQuery({
    enabled: Boolean(userId) && Boolean(documentId),
    queryFn: () =>
      getDocument({
        documentId: documentId as string,
        userId: userId as string,
      }),
    queryKey: documentId ? documentKey(documentId) : ['document', 'anonymous'],
  });
}

/**
 * Signed URL xem/tải (TTL 3600s). Không lưu URL vào DB hay state persist;
 * fail thì UI báo lỗi tiếng Việt, không tự mở link hỏng.
 */
export function useDocumentUrl(storagePath: string | undefined) {
  return useQuery({
    enabled: Boolean(storagePath),
    queryFn: () => getDocumentUrl(storagePath as string),
    queryKey: storagePath
      ? documentUrlKey(storagePath)
      : ['document-url', 'anonymous'],
    staleTime: DOCUMENT_URL_STALE_MS,
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

export function useRenameDocument(userId: string, documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rawName: string) =>
      renameDocument({ documentId, rawName }),
    onSuccess: (updated) => {
      queryClient.setQueryData<DocumentWithSubject[] | undefined>(
        documentsKey(userId),
        (old) =>
          old?.map((doc) =>
            doc.id === documentId
              ? { ...doc, display_name: updated.display_name }
              : doc,
          ),
      );
      void queryClient.invalidateQueries({
        queryKey: documentKey(documentId),
      });
      void queryClient.invalidateQueries({ queryKey: documentsKey(userId) });
    },
  });
}

export function useAssignDocumentSubject(userId: string, documentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subjectId: string | null) =>
      assignDocumentSubject({ documentId, subjectId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: documentKey(documentId),
      });
      void queryClient.invalidateQueries({ queryKey: documentsKey(userId) });
    },
  });
}

export function useDeleteDocument(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { documentId: string; storagePath: string }) =>
      deleteDocument(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: documentsKey(userId) });
    },
  });
}

export function useSubjects(userId: string | undefined) {
  return useQuery({
    enabled: Boolean(userId),
    queryFn: () => listSubjects(userId as string),
    queryKey: userId ? subjectsKey(userId) : ['subjects', 'anonymous'],
  });
}

/** Số tài liệu trong một môn — dùng cho cảnh báo trước khi xóa môn. */
export function useSubjectDocumentCount(
  userId: string | undefined,
  subjectId: string | undefined,
) {
  return useQuery({
    enabled: Boolean(userId) && Boolean(subjectId),
    queryFn: () =>
      countDocumentsInSubject({
        subjectId: subjectId as string,
        userId: userId as string,
      }),
    queryKey:
      userId && subjectId
        ? [...subjectsKey(userId), 'count', subjectId]
        : ['subjects', 'anonymous', 'count'],
  });
}

export function useCreateSubject(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rawName: string) => createSubject({ rawName, userId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subjectsKey(userId) });
    },
  });
}

export function useRenameSubject(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { rawName: string; subjectId: string }) =>
      renameSubject({ ...input, userId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subjectsKey(userId) });
      void queryClient.invalidateQueries({ queryKey: documentsKey(userId) });
    },
  });
}

export function useDeleteSubject(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subjectId: string) => deleteSubject(subjectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subjectsKey(userId) });
      void queryClient.invalidateQueries({ queryKey: documentsKey(userId) });
    },
  });
}
