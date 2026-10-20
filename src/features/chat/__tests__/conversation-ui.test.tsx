import { afterEach, expect, it, jest } from '@jest/globals';
import { act, create } from 'react-test-renderer';
import { Button, PaperProvider } from 'react-native-paper';
import { QaSection } from '../QaSection';
import { useAskQuestion, useQuestions, useSaveConversation } from '../queries';
import { FormTextInput } from '../../../shared/components/FormTextInput';
import { lightTheme } from '../../../shared/theme/theme';
import type { DocumentWithSubject } from '../../../shared/types/database';

jest.mock('../../../shared/lib/supabase', () => ({ supabase: {} }));
jest.mock('../queries', () => ({ useAskQuestion: jest.fn(), useQuestions: jest.fn(), useSaveConversation: jest.fn() }));
jest.mock('expo-crypto', () => { let id = 0; return { randomUUID: () => `00000000-0000-4000-8000-${String(++id).padStart(12, '0')}` }; });
let tree: ReturnType<typeof create>;
afterEach(() => { act(() => tree?.unmount()); });
it('phiên giữ ngữ cảnh, chỉ lưu theo nút, phiên mới bỏ ngữ cảnh trước', async () => {
  const ask = jest.fn(async (_input: unknown) => ({ question: 'Câu hỏi', answer: 'Câu trả lời', model: 'test-model' }));
  const save = jest.fn(async () => undefined);
  jest.mocked(useAskQuestion).mockReturnValue({ mutateAsync: ask } as unknown as ReturnType<typeof useAskQuestion>);
  jest.mocked(useSaveConversation).mockReturnValue({ mutateAsync: save } as unknown as ReturnType<typeof useSaveConversation>);
  jest.mocked(useQuestions).mockReturnValue({ data: [] } as unknown as ReturnType<typeof useQuestions>);
  const doc = { id: 'doc', user_id: 'u', file_ext: 'txt', extracted_text: 'Nội dung' } as DocumentWithSubject;
  act(() => { tree = create(<PaperProvider theme={lightTheme}><QaSection doc={doc} userId="u" /></PaperProvider>); });
  const button = (id: string) => tree.root.findAllByType(Button).find((b) => b.props.testID === id);
  const send = async () => {
    act(() => tree.root.findByType(FormTextInput).props.onChangeText('Vì sao?'));
    await act(async () => { button('qa-submit')?.props.onPress(); });
  };
  await send();
  await send();
  expect(ask.mock.calls[0]?.[0]).toMatchObject({ history: [] });
  expect(ask.mock.calls[1]?.[0]).toMatchObject({ history: [expect.objectContaining({ answer: 'Câu trả lời' })] });
  expect(save).not.toHaveBeenCalled();
  await act(async () => { button('qa-save')?.props.onPress(); });
  expect(save).toHaveBeenCalledTimes(1);
  act(() => { button('qa-new')?.props.onPress(); });
  await send();
  expect(ask.mock.calls[2]?.[0]).toMatchObject({ history: [] });
});
