import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { spacing } from '../theme/spacing';

/** Hiển thị tiêu đề/ý chính từ AI, không chạy HTML hay mã trong kết quả. */
export function AiResultText({ text, testID }: { text: string; testID?: string }) {
  return <View testID={testID} style={{ gap: spacing.sm }}>
    {text.split('\n').filter((line) => line.trim()).map((line, index) => {
      const heading = /^#{1,4}\s+/.test(line);
      const value = line.replace(/^#{1,4}\s+/, '').replace(/^[-*]\s+/, '• ');
      return <Text key={index} selectable variant={heading ? 'titleSmall' : 'bodyMedium'}>
        {value.split(/(\*\*[^*]+\*\*)/g).map((part, i) => part.startsWith('**')
          ? <Text key={i} style={{ fontWeight: '700' }}>{part.slice(2, -2)}</Text> : part)}
      </Text>;
    })}
  </View>;
}
