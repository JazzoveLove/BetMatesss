import { Pressable, Text, View } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import type { HistoryFilter } from '@/features/bets/hooks/useHistory'

const FILTER_EMPTY_TEXT: Record<HistoryFilter, string> = {
  all: 'Brak zakładów w tym widoku',
  active: 'Brak aktywnych zakładów',
  completed: 'Brak zakończonych zakładów',
}

export type HistoryEmptyStateProps = {
  filter: HistoryFilter
  hasAnyBets: boolean
  onCreateBet: () => void
}

export function HistoryEmptyState({ filter, hasAnyBets, onCreateBet }: HistoryEmptyStateProps) {
  if (!hasAnyBets) {
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
          Twoje zakłady pojawią się tutaj
        </Text>
        <Pressable
          onPress={onCreateBet}
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
          <Text style={{ color: Colors.white, fontSize: 14, fontWeight: '700' }}>Załóż pierwszy zakład</Text>
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
      <Text style={{ fontSize: 14, color: Colors.textMuted }}>{FILTER_EMPTY_TEXT[filter]}</Text>
    </View>
  )
}
