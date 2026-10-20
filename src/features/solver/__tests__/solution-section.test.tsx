import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, create } from 'react-test-renderer';
import { Button, PaperProvider } from 'react-native-paper';
import { SolutionSection } from '../SolutionSection';
import { lightTheme } from '../../../shared/theme/theme';
import { useRequestSolution, useSolution } from '../queries';
import { FormTextInput } from '../../../shared/components/FormTextInput';
import type { DocumentWithSubject } from '../../../shared/types/database';
import type { SolutionRequest } from '../api';
import { GeminiQuotaError } from '../../../shared/ai/transport';

jest.mock('../queries', () => ({ useRequestSolution: jest.fn(), useSolution: jest.fn() }));
const queryMock = jest.mocked(useSolution);
const mutationMock = jest.mocked(useRequestSolution);
const mutateAsync = jest.fn(async (input: Omit<SolutionRequest, 'userId'>) => ({ solution_text: `Phản hồi ${input.kind}`, response_type: input.kind, hint_step: input.hintStep }));
const trees: ReturnType<typeof create>[] = [];
const doc = { id: 'doc-1', user_id: 'u1', file_ext: 'pdf', extraction_status: 'done', extracted_text: 'Đề toán' } as DocumentWithSubject;
function render(document = doc, analysisRequest?: string) {
  let tree: ReturnType<typeof create> | undefined;
  act(() => { tree = create(<PaperProvider theme={lightTheme}><SolutionSection doc={document} userId="u1" analysisRequest={analysisRequest} /></PaperProvider>); });
  if (!tree) throw new Error('Không render được');
  trees.push(tree); return tree;
}
function state(pending = false) {
  queryMock.mockReturnValue({ isPending: false, isError: false, data: null } as unknown as ReturnType<typeof useSolution>);
  mutationMock.mockReturnValue({ isPending: pending, mutateAsync } as unknown as ReturnType<typeof useRequestSolution>);
}
beforeEach(() => { jest.clearAllMocks(); state(); });
afterEach(() => { act(() => { for (const tree of trees) tree.unmount(); }); trees.length = 0; });
const button = (tree: ReturnType<typeof create>, id: string) => tree.root.findAllByType(Button).find((node) => node.props.testID === id);

describe('SolutionSection theo PDF', () => {
  it('DOCX/thiếu nội dung chặn các nút; pending khóa thao tác', () => {
    for (const document of [{ ...doc, file_ext: 'docx' }, { ...doc, extracted_text: '' }]) {
      expect(button(render(document), 'solution-hint')).toBeUndefined();
    }
    state(true);
    expect(button(render(), 'solution-hint')?.props.disabled).toBe(true);
  });
  it('gợi ý tiếp nối; chỉ yêu cầu lời giải sau nút riêng, hỏi tiếp có lịch sử', async () => {
    const tree = render();
    await act(async () => { button(tree, 'solution-hint')?.props.onPress(); });
    await act(async () => { button(tree, 'solution-hint')?.props.onPress(); });
    expect(mutateAsync.mock.calls[0]?.[0]).toMatchObject({ kind: 'hint', hintStep: 1, history: [] });
    expect(mutateAsync.mock.calls[1]?.[0]).toMatchObject({ kind: 'hint', hintStep: 2, history: [expect.objectContaining({ kind: 'hint' })] });
    expect(mutateAsync.mock.calls.some(([input]) => input.kind === 'solution')).toBe(false);
    await act(async () => { button(tree, 'solution-full')?.props.onPress(); });
    act(() => tree.root.findByType(FormTextInput).props.onChangeText('Vì sao dùng công thức đó?'));
    await act(async () => { button(tree, 'solution-follow-up')?.props.onPress(); });
    expect(mutateAsync.mock.calls[3]?.[0]).toMatchObject({ kind: 'follow_up', question: 'Vì sao dùng công thức đó?' });
    expect(mutateAsync.mock.calls[3]?.[0]?.history).toHaveLength(3);
  });
  it('intent OCR chỉ chạy phân tích một lần; quota không tự retry', async () => {
    render(doc, 'ocr-intent');
    await act(async () => undefined);
    expect(mutateAsync).toHaveBeenCalledTimes(1);
    expect(mutateAsync.mock.calls[0]?.[0]?.kind).toBe('analysis');
    mutateAsync.mockRejectedValueOnce(new GeminiQuotaError());
    const tree = render();
    await act(async () => { button(tree, 'solution-hint')?.props.onPress(); });
    expect(mutateAsync).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(tree.toJSON())).toContain('hạn mức');
  });
});
