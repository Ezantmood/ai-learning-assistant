import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, create } from 'react-test-renderer';
import { Button, List, PaperProvider, Text } from 'react-native-paper';
import { GeminiQuotaError } from '../../../shared/ai/transport';
import { darkTheme, lightTheme } from '../../../shared/theme/theme';
import type { DocumentWithSubject } from '../../../shared/types/database';
import { SummarySection } from '../SummarySection';
import { useRequestSummary, useSummary, useSummaryHistory } from '../queries';
import { loadSummarySource } from '../source';

jest.mock('../../../shared/lib/supabase', () => ({ supabase: {} }));
jest.mock('../source', () => ({ loadSummarySource: jest.fn() }));
jest.mock('../queries', () => ({
  documentDetailKey: (id: string) => ['document', id],
  useRequestSummary: jest.fn(), useSummary: jest.fn(), useSummaryHistory: jest.fn(),
}));

const rawText = 'Chương 1\nNguyên văn <b>không phải HTML</b>.\n' + 'Dòng văn bản gốc.\n'.repeat(1500) + 'MÃ-CUỐI-935';
const doc = { id: 'pdf', user_id: 'u', file_ext: 'pdf', file_size: 1024, extraction_status: 'done',
  extracted_text: rawText, storage_path: 'u/pdf.pdf', updated_at: new Date().toISOString() } as DocumentWithSubject;
const row = { id: 's', created_at: '2026-10-21T00:00:00Z', summary_level: 'short', summary_text: 'Tóm tắt riêng.' };
const mutate = jest.fn();
const onExtracted = jest.fn();
let tree: ReturnType<typeof create>;

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useSummary).mockReturnValue({ data: row } as unknown as ReturnType<typeof useSummary>);
  jest.mocked(useSummaryHistory).mockReturnValue({ data: [row] } as unknown as ReturnType<typeof useSummaryHistory>);
  jest.mocked(useRequestSummary).mockReturnValue({ mutate, isPending: false } as unknown as ReturnType<typeof useRequestSummary>);
  jest.mocked(loadSummarySource).mockResolvedValue({ kind: 'pdf', base64Data: 'PDF-GOC' });
});
afterEach(() => { act(() => tree?.unmount()); });

function render(document = doc, theme = lightTheme) {
  act(() => { tree = create(<QueryClientProvider client={new QueryClient()}><PaperProvider theme={theme}>
    <SummarySection doc={document} userId="u" onExtracted={onExtracted} />
  </PaperProvider></QueryClientProvider>); });
}
function toggle() {
  const button = tree.root.findAllByProps({ testID: 'pdf-extracted-toggle' }).find((node) => typeof node.props.onPress === 'function');
  expect(button).toBeDefined();
  act(() => button?.props.onPress());
}
function text() { return tree.root.findAllByType(Text).find((node) => node.props.testID === 'pdf-extracted-text'); }
function button(id: string) { return tree.root.findAllByType(Button).find((node) => node.props.testID === id); }

it.each([lightTheme, darkTheme])('xem/thu gọn văn bản thật, chọn được và không cắt nguồn dài ở cả hai theme', (theme) => {
  render(doc, theme);
  expect(text()).toBeUndefined();
  const accordion = tree.root.findAllByType(List.Accordion).find((node) => node.props.testID === 'pdf-extracted-toggle');
  expect(accordion?.props.description).toContain(rawText.length.toLocaleString('vi-VN'));
  toggle();
  expect(text()?.props.children).toBe(rawText);
  expect(text()?.props.selectable).toBe(true);
  toggle();
  expect(text()).toBeUndefined();
  expect(mutate).not.toHaveBeenCalled();
});

it('tóm tắt lại dùng text đã lưu; Đọc lại PDF bắt buộc tải file gốc', async () => {
  render();
  await act(async () => { button('summary-rerun')?.props.onPress(); });
  expect(loadSummarySource).not.toHaveBeenCalled();
  expect(mutate).toHaveBeenLastCalledWith(expect.objectContaining({ source: { kind: 'txt', textContent: rawText } }), expect.anything());
  // Mô phỏng mutation trước đã hoàn tất và props được refetch.
  const callbacks = mutate.mock.calls[0]?.[1] as { onSettled: () => void };
  act(() => callbacks.onSettled());
  toggle();
  await act(async () => { button('pdf-extract-again')?.props.onPress(); });
  expect(loadSummarySource).toHaveBeenCalledWith({ file_ext: 'pdf', id: doc.id, storage_path: doc.storage_path });
  expect(mutate).toHaveBeenLastCalledWith(expect.objectContaining({ source: { kind: 'pdf', base64Data: 'PDF-GOC' } }), expect.anything());
  const savedCallbacks = mutate.mock.calls[1]?.[1] as { onSuccess: (row: { id: string }) => void };
  act(() => savedCallbacks.onSuccess({ id: 'saved' }));
  expect(onExtracted).toHaveBeenCalledTimes(1);
});

it('tải lại lỗi giữ nguyên văn bản cũ và hiển thị lỗi chuẩn hóa', async () => {
  jest.mocked(loadSummarySource).mockRejectedValue(new Error('Network request failed'));
  render(); toggle();
  await act(async () => { button('pdf-extract-again')?.props.onPress(); });
  expect(text()?.props.children).toBe(rawText);
  expect(mutate).not.toHaveBeenCalled();
  expect(JSON.stringify(tree.toJSON())).toContain('kết nối mạng');
  expect(button('pdf-extract-again')?.props.disabled).toBe(false);
});

it('chưa có text có hướng dẫn; lần thất bại có cảnh báo và lối đọc lại', () => {
  render({ ...doc, extracted_text: null, extraction_status: 'failed' }); toggle();
  expect(text()).toBeUndefined();
  expect(tree.root.findAllByType(Text).find((node) => node.props.testID === 'pdf-extracted-warning')?.props.children).toContain('Chưa có văn bản mới được lưu.');
  expect(button('pdf-extract-again')?.props.disabled).toBe(false);
});

it('quota khóa đọc lại và vẫn cho xem bản đã lưu', () => {
  jest.mocked(useRequestSummary).mockReturnValue({ mutate, error: new GeminiQuotaError('daily') } as unknown as ReturnType<typeof useRequestSummary>);
  render(); toggle();
  expect(button('pdf-extract-again')?.props.disabled).toBe(true);
  expect(text()?.props.children).toBe(rawText);
});

it('processing khóa đọc lại; TXT không xuất hiện mục trích PDF', () => {
  render({ ...doc, extraction_status: 'processing' }); toggle();
  expect(button('pdf-extract-again')?.props.disabled).toBe(true);
  act(() => tree.unmount());
  render({ ...doc, file_ext: 'txt' });
  expect(tree.root.findAllByProps({ testID: 'pdf-extracted-toggle' })).toHaveLength(0);
});
