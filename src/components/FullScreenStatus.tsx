import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

type FullScreenStatusProps = {
  message: string;
};

export function FullScreenStatus({ message }: FullScreenStatusProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator accessibilityLabel={message} />
      <Text>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    padding: 24,
  },
});
