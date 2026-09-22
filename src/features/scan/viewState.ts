export type ScanViewState = 'processing' | 'result' | 'empty' | 'error';

export function getScanViewState(input: {
  error: string | null;
  isProcessing: boolean;
  text: string | null;
}): ScanViewState {
  if (input.isProcessing) return 'processing';
  if (input.error) return 'error';
  if (input.text) return 'result';
  return 'empty';
}
