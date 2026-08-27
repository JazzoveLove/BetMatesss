import { Pressable, ScrollView, Text } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import type { BalanceCounts, BalanceFilter } from '@/features/balances/types/balance.types'

export type BalanceFilterBarProps = {
  filter: BalanceFilter
  onFilterChange: (filter: BalanceFilter) => void
  counts: BalanceCounts
}

const FILTERS: { key: BalanceFilter; label: string }[] = [
  { key: 'all', label: 'Wszyscy' },
  { key: 'positive', label: 'Na plusie' },
  { key: 'negative', label: 'Na minusie' },
  { key: 'zero', label: 'Na zero' },
]

export function BalanceFilterBar({ filter, onFilterChange, counts }: BalanceFilterBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingBottom: 4, marginBottom: 16 }}
    >
      {FILTERS.map(({ key, label }) => {
        const active = filter === key
        return (
          <Pressable
            key={key}
            onPress={() => onFilterChange(key)}
            style={({ pressed }) => [
              {
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: active ? `${Colors.accent}30` : Colors.card,
                borderWidth: 0.5,
                borderColor: active ? Colors.accent : Colors.border,
              },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: active ? Colors.accentLight : Colors.textMuted,
              }}
            >
              {label} ({counts[key]})
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
