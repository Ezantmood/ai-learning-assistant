import { afterEach, expect, it, jest } from '@jest/globals';
import { act, create } from 'react-test-renderer';
import { Button, PaperProvider } from 'react-native-paper';
import { router } from 'expo-router';
import { ScanTextEditor } from '../scan-text-editor';
import { useSaveScanText } from '../queries';
import { FormTextInput } from '../../../shared/components/FormTextInput';
import { lightTheme } from '../../../shared/theme/theme';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('../queries', () => ({ useSaveScanText: jest.fn() }));
let tree: ReturnType<typeof create>;
afterEach(() => { act(() => tree?.unmount()); jest.clearAllMocks(); });
it('lưu chữ đã sửa trước khi chuyển phân tích; lưu lỗi giữ màn và nội dung', async () => {
  const save = jest.fn(async (_input: unknown) => undefined);
  jest.mocked(useSaveScanText).mockReturnValue({ mutateAsync: save } as unknown as ReturnType<typeof useSaveScanText>);
  act(() => { tree = create(<PaperProvider theme={lightTheme}><ScanTextEditor documentId="doc" userId="u" initialText="OCR sai" /></PaperProvider>); });
  act(() => tree.root.findByType(FormTextInput).props.onChangeText('Đề đã kiểm tra'));
  const send = () => tree.root.findAllByType(Button).find((b) => b.props.testID === 'scan-analyze')?.props.onPress();
  await act(async () => { send(); });
  expect(save).toHaveBeenLastCalledWith({ documentId: 'doc', text: 'Đề đã kiểm tra' });
  expect(router.push).toHaveBeenCalledWith({ pathname: '/documents/[id]', params: { id: 'doc', analyze: expect.any(String) } });
  jest.mocked(router.push).mockClear();
  save.mockRejectedValueOnce(new Error('offline'));
  await act(async () => { send(); });
  expect(router.push).not.toHaveBeenCalled();
  expect(tree.root.findByType(FormTextInput).props.value).toBe('Đề đã kiểm tra');
});
