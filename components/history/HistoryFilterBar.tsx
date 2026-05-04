import { XStack, YStack, Text } from 'tamagui'
import type { HistoryFilter } from '../../hooks/useHistory'

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
    <XStack style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
      {FILTERS.map(({ key, label }) => {
        const active = filter === key
        return (
          <YStack
            key={key}
            onPress={() => onFilterChange(key)}
            pressStyle={{ opacity: 0.85 }}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: active ? '#534AB730' : '#181c24',
              borderWidth: 0.5,
              borderColor: active ? '#534AB7' : '#1e2330',
            }}
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
          </YStack>
        )
      })}
    </XStack>
  )
}
