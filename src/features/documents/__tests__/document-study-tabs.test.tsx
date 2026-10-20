import { afterEach, expect, it } from '@jest/globals';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { act, create } from 'react-test-renderer';
import { PaperProvider, SegmentedButtons } from 'react-native-paper';
import { DocumentStudyTabs } from '../document-study-tabs';
import { lightTheme } from '../../../shared/theme/theme';

let tree: ReturnType<typeof create>;
afterEach(() => { act(() => tree?.unmount()); });
function Draft({ name }: { name: string }) {
  const [text, setText] = useState('');
  return <TextInput testID={name} value={text} onChangeText={setText} />;
}
function screen(analysisRequest?: string) {
  return <PaperProvider theme={lightTheme}><DocumentStudyTabs initialMode="summary" analysisRequest={analysisRequest}
    summary={<Draft name="summary-draft" />} chat={<Draft name="chat-draft" />} solver={<Draft name="solver-draft" />} /></PaperProvider>;
}
function select(mode: string) {
  act(() => tree.root.findByType(SegmentedButtons).props.onValueChange(mode));
}
function panel(name: string) {
  return tree.root.findAllByType(View).find((node) => node.props.testID === `study-panel-${name}`);
}
it('đổi mục giữ draft và chỉ công bố vùng hiện tại cho trình đọc màn hình', () => {
  act(() => { tree = create(screen()); });
  select('chat');
  act(() => tree.root.findAllByType(TextInput).find((node) => node.props.testID === 'chat-draft')?.props.onChangeText('Câu hỏi đang soạn'));
  select('solver');
  expect(panel('chat')?.props.accessibilityElementsHidden).toBe(true);
  expect(panel('solver')?.props.accessibilityElementsHidden).toBe(false);
  select('chat');
  expect(tree.root.findAllByType(TextInput).find((node) => node.props.testID === 'chat-draft')?.props.value).toBe('Câu hỏi đang soạn');
  expect(panel('summary')?.props.importantForAccessibility).toBe('no-hide-descendants');
});
it('intent từ OCR mở mục giải bài; người dùng vẫn có thể đổi mục sau đó', () => {
  act(() => { tree = create(screen()); });
  select('chat');
  act(() => tree.update(screen('ocr-1')));
  expect(tree.root.findByType(SegmentedButtons).props.value).toBe('solver');
  select('summary');
  expect(tree.root.findByType(SegmentedButtons).props.value).toBe('summary');
  act(() => tree.update(screen('ocr-2')));
  expect(tree.root.findByType(SegmentedButtons).props.value).toBe('solver');
});
