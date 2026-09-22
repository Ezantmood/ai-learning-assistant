import { useMutation, useQueryClient } from '@tanstack/react-query';

import { captureScanImage, pickScanImage, runScan } from './api';
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
    },
  });
}
