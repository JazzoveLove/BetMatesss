import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors } from '../constants/colors'

export function AppErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error
  resetErrorBoundary: () => void
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Coś poszło nie tak</Text>
      <Text style={styles.message}>{error.message}</Text>
      <Pressable style={styles.btn} onPress={resetErrorBoundary}>
        <Text style={styles.btnText}>Spróbuj ponownie</Text>
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
    padding: 32,
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  message: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  btn: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  btnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
})
