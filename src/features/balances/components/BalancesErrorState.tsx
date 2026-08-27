import { Pressable, Text, View } from 'react-native'
import { Colors } from '@/shared/constants/colors'

export type BalancesErrorStateProps = {
  onRetry: () => void
}

export function BalancesErrorState({ onRetry }: BalancesErrorStateProps) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 }} testID="balances-error">
      <Text style={{ color: Colors.text, fontSize: 15, fontWeight: '600', marginBottom: 16, textAlign: 'center' }}>
        Nie udało się wczytać bilansów.
      </Text>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [
          { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20 },
          pressed && { opacity: 0.85 },
        ]}
      >
        <Text style={{ color: Colors.white, fontSize: 14, fontWeight: '700' }}>Spróbuj ponownie</Text>
      </Pressable>
    </View>
  )
}
