import { Pressable, Text, View } from 'react-native'
import { Colors } from '@/shared/constants/colors'

export type BalanceEmptyStateProps = {
  hasAnyFriends: boolean
  onGoToFriends: () => void
}

export function BalanceEmptyState({ hasAnyFriends, onGoToFriends }: BalanceEmptyStateProps) {
  if (!hasAnyFriends) {
    return (
      <View
        style={{
          backgroundColor: Colors.card,
          borderRadius: 14,
          borderWidth: 0.5,
          borderColor: Colors.border,
          padding: 28,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 14, color: Colors.textMuted, marginBottom: 16, textAlign: 'center' }}>
          Nie masz jeszcze żadnych znajomych
        </Text>
        <Pressable
          onPress={onGoToFriends}
          style={({ pressed }) => [
            {
              backgroundColor: Colors.accent,
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 20,
            },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={{ color: Colors.white, fontSize: 14, fontWeight: '700' }}>Idź do Znajomych</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View
      style={{
        backgroundColor: Colors.card,
        borderRadius: 14,
        borderWidth: 0.5,
        borderColor: Colors.border,
        padding: 28,
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: 14, color: Colors.textMuted }}>Nikt nie pasuje do tego filtra</Text>
    </View>
  )
}
