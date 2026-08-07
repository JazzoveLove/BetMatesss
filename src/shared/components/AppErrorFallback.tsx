import { Pressable, Text, View } from 'react-native'
import { styles } from './styles/AppErrorFallback.styles'

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
