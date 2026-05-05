import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors } from '../constants/colors'

export function ScreenErrorFallback({
  resetErrorBoundary,
}: {
  error: Error
  resetErrorBoundary: () => void
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Nie udało się załadować ekranu</Text>
      <Pressable style={styles.btn} onPress={resetErrorBoundary}>
        <Text style={styles.btnText}>Odśwież</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: { color: Colors.textMuted, fontSize: 15, textAlign: 'center' },
  btn: {
    backgroundColor: Colors.cardAlt,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  btnText: { color: Colors.accentLight, fontSize: 14, fontWeight: '600' },
})
