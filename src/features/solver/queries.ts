import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSolution, requestSolution, type SolverDocument } from './api';

export function solutionKey(documentId: string) {
  return ['solution', documentId] as const;
}

export function useSolution(userId: string | undefined, documentId: string | undefined) {
  return useQuery({
    enabled: Boolean(userId) && Boolean(documentId),
    queryFn: () => getSolution({ documentId: documentId as string, userId: userId as string }),
    queryKey: documentId ? solutionKey(documentId) : ['solution', 'anonymous'],
  });
}

export function useRequestSolution(userId: string, documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (document: SolverDocument) => requestSolution({ document, userId }),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: solutionKey(documentId) });
    },
  });
}
