import { Pressable, Text, View } from 'react-native'
import { styles } from './styles/ScreenErrorFallback.styles'

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
