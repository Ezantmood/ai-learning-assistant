import { useMutation } from '@tanstack/react-query';

import { captureScanImage, pickScanImage } from './api';

export function usePickScanImage() {
  return useMutation({ mutationFn: pickScanImage });
}

export function useCaptureScanImage() {
  return useMutation({ mutationFn: captureScanImage });
}
