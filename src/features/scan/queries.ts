import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { captureScanImage, getLatestScan, pickScanImage, runScan } from './api';
import type { ScanImage } from './schemas';

export function usePickScanImage() {
  return useMutation({ mutationFn: pickScanImage });
}

export function useCaptureScanImage() {
  return useMutation({ mutationFn: captureScanImage });
}

export function useRunScan(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (image: ScanImage) => runScan({ image, userId }),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['documents', userId] });
      void queryClient.invalidateQueries({ queryKey: ['latest-scan', userId] });
    },
  });
}

export function useLatestScan(userId: string | undefined) {
  return useQuery({
    enabled: Boolean(userId),
    queryFn: () => getLatestScan(userId as string),
    queryKey: ['latest-scan', userId ?? 'anonymous'],
  });
}
