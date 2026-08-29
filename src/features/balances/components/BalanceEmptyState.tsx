import { Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/shared/constants/colors'

export type BalanceEmptyStateProps = {
  /**
   * "noFriends" — konto bez żadnych znajomych (nadrzędny stan pusty ekranu).
   * "filterEmpty" — są dane, ale aktywny filtr nic nie zwraca (rzadkie, bo
   * chipy z zerowym licznikiem są wyłączone, ale np. odświeżenie może
   * opróżnić aktywny filtr).
   */
  variant?: 'noFriends' | 'filterEmpty'
  onGoToFriends: () => void
}

export function BalanceEmptyState({ variant = 'noFriends', onGoToFriends }: BalanceEmptyStateProps) {
  if (variant === 'filterEmpty') {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 }} testID="balances-empty-filter">
        <Text style={{ fontSize: 14, color: Colors.textMuted, textAlign: 'center' }}>Nikt nie pasuje do tego filtra</Text>
      </View>
    )
  }

  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 }} testID="balances-empty">
      <Ionicons name="people-outline" size={32} color={Colors.textMuted} />
      <Text style={{ color: Colors.text, fontSize: 17, fontWeight: '700', marginTop: 16, textAlign: 'center' }}>
        Zacznij od znajomych
      </Text>
      <Text style={{ color: Colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: 8, textAlign: 'center' }}>
        Bilanse pojawią się, gdy rozliczysz pierwszy zakład ze znajomym.
      </Text>
      <Pressable
        onPress={onGoToFriends}
        style={({ pressed }) => [
          {
            backgroundColor: Colors.accent,
            borderRadius: 12,
            paddingVertical: 12,
            paddingHorizontal: 20,
            marginTop: 20,
          },
          pressed && { opacity: 0.85 },
        ]}
      >
        <Text style={{ color: Colors.white, fontSize: 14, fontWeight: '700' }}>Dodaj znajomego</Text>
      </Pressable>
    </View>
  )
}
