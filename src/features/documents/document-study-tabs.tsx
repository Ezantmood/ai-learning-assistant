import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';
import { spacing } from '../../shared/theme/spacing';

type StudyMode = 'summary' | 'chat' | 'solver';
type Props = {
  summary: ReactNode;
  chat: ReactNode;
  solver: ReactNode;
  initialMode: 'summary' | 'solver';
  analysisRequest?: string;
};

/** Giữ các vùng được mount để chuyển mục không mất câu hỏi/lượt chat đang học. */
export function DocumentStudyTabs({ summary, chat, solver, initialMode, analysisRequest }: Props) {
  const [selection, setSelection] = useState<{ mode: StudyMode; intent?: string }>({ mode: analysisRequest ? 'solver' : initialMode, intent: analysisRequest });
  // Một intent phân tích mới phải mở đúng mục, kể cả khi route đang ở Hỏi đáp.
  const active = analysisRequest && selection.intent !== analysisRequest ? 'solver' : selection.mode;
  return <View style={styles.content}>
    <SegmentedButtons value={active}
      onValueChange={(mode) => setSelection({ mode: mode as StudyMode, intent: analysisRequest })}
      buttons={[
        { value: 'summary', label: 'Tóm tắt', testID: 'study-summary' },
        { value: 'chat', label: 'Hỏi đáp', testID: 'study-chat' },
        { value: 'solver', label: 'Giải bài', testID: 'study-solver' },
      ]} />
    {([{ mode: 'summary', content: summary }, { mode: 'chat', content: chat }, { mode: 'solver', content: solver }] as const).map((panel) => (
      <View key={panel.mode} testID={`study-panel-${panel.mode}`}
        style={active === panel.mode ? undefined : styles.hidden}
        accessibilityElementsHidden={active !== panel.mode}
        importantForAccessibility={active === panel.mode ? 'auto' : 'no-hide-descendants'}>
        {panel.content}
      </View>
    ))}
  </View>;
}

const styles = StyleSheet.create({ content: { gap: spacing.lg }, hidden: { display: 'none' } });
