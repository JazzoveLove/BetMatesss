import { Pressable, Text, View } from 'react-native'
import { styles } from './styles/AppErrorFallback.styles'

export function AppErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: unknown
  resetErrorBoundary: () => void
}) {
  const message = error instanceof Error ? error.message : 'Nieznany błąd aplikacji.'
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Coś poszło nie tak</Text>
      <Text style={styles.message}>{message}</Text>
      <Pressable style={styles.btn} onPress={resetErrorBoundary}>
        <Text style={styles.btnText}>Spróbuj ponownie</Text>
      </Pressable>
    </View>
  )
}
