import { Pressable, Text, View } from 'react-native'
import type { HistoryFilter } from '@/features/bets/hooks/useHistory'

export type HistoryFilterBarProps = {
  filter: HistoryFilter
  onFilterChange: (filter: HistoryFilter) => void
}

const FILTERS: { key: HistoryFilter; label: string }[] = [
  { key: 'all', label: 'Wszystkie' },
  { key: 'active', label: 'Aktywne' },
  { key: 'completed', label: 'Zakończone' },
]

export function HistoryFilterBar({ filter, onFilterChange }: HistoryFilterBarProps) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
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
                backgroundColor: active ? '#534AB730' : '#181c24',
                borderWidth: 0.5,
                borderColor: active ? '#534AB7' : '#1e2330',
              },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: active ? '#7F77DD' : 'rgba(232,230,224,0.5)',
              }}
            >
              {label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
