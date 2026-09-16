import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

export default function NotesScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Ghi chú học tập</Text>
      <Text>CRUD ghi chú sẽ được thực hiện ở G3.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
    justifyContent: 'center',
    padding: 24,
  },
});
