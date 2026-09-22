import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, create } from 'react-test-renderer';
import { Button, PaperProvider } from 'react-native-paper';
import { SolutionSection } from '../solution-section';
import { lightTheme } from '../../../../src/shared/theme/theme';
import { useRequestSolution, useSolution } from '../../../../src/features/solver/queries';
import type { DocumentWithSubject } from '../../../../src/features/documents/api';
import { GeminiQuotaError } from '../../../../src/lib/ai/transport';

jest.mock('../../../../src/features/solver/queries', () => ({
  useRequestSolution: jest.fn(), useSolution: jest.fn(),
}));
const queryMock = jest.mocked(useSolution);
const mutationMock = jest.mocked(useRequestSolution);
const mutate = jest.fn();
const trees: ReturnType<typeof create>[] = [];
const doc = {
  id: 'doc-1', user_id: 'u1', file_ext: 'pdf', extraction_status: 'done',
  extracted_text: 'Đề toán',
} as DocumentWithSubject;

function render(document = doc) {
  let tree: ReturnType<typeof create> | undefined;
  act(() => {
    tree = create(<PaperProvider theme={lightTheme}>
      <SolutionSection doc={document} userId="u1" />
    </PaperProvider>);
  });
  if (!tree) throw new Error('Không render được SolutionSection');
  trees.push(tree);
  return tree;
}
function setState(query: Record<string, unknown>, mutation: Record<string, unknown> = {}) {
  queryMock.mockReturnValue({ isPending: false, isError: false, data: null, ...query } as ReturnType<typeof useSolution>);
  mutationMock.mockReturnValue({ isPending: false, error: null, mutate, ...mutation } as unknown as ReturnType<typeof useRequestSolution>);
}
beforeEach(() => { jest.clearAllMocks(); setState({}); });
afterEach(() => {
  act(() => { for (const tree of trees) tree.unmount(); });
  trees.length = 0;
});

describe('SolutionSection', () => {
  it('DOCX và thiếu text chỉ dẫn trước, không có nút chạy', () => {
    for (const document of [
      { ...doc, file_ext: 'docx' }, { ...doc, extracted_text: '   ' },
    ]) {
      const tree = render(document);
      expect(tree.root.findAllByProps({ testID: 'solution-run' })).toHaveLength(0);
      expect(tree.root.findAllByProps({ testID: 'solution-rerun' })).toHaveLength(0);
    }
  });
  it('empty → bấm một lần; pending disabled; row mới nhất hiển thị', () => {
    const empty = render();
    const run = empty.root.findByProps({ testID: 'solution-run' });
    act(() => { run.props.onPress(); });
    expect(mutate).toHaveBeenCalledTimes(1);
    setState({}, { isPending: true });
    const pending = render();
    expect(pending.root.findByProps({ testID: 'solution-running' }).props.disabled).toBe(true);
    setState({ data: { solution_text: 'Bước 1' } });
    const saved = render();
    expect(saved.root.findByProps({ testID: 'solution-text' }).props.children).toBe('Bước 1');
    expect(saved.root.findByProps({ testID: 'solution-rerun' }).type).toBe(Button);
  });
  it('lỗi thường có Thử lại; quota chỉ có banner', () => {
    setState({}, { error: new Error('offline') });
    expect(render().root.findAllByType(Button).filter((node) => node.props.testID === 'solution-retry')).toHaveLength(1);
    setState({}, { error: new GeminiQuotaError() });
    const quota = render();
    expect(quota.root.findAllByType(Button).filter((node) => node.props.testID === 'solution-retry')).toHaveLength(0);
    expect(quota.root.findAllByType(Button).filter((node) => node.props.testID === 'solution-run')).toHaveLength(0);
  });
});
