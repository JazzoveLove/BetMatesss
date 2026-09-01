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
      // flexGrow: 0 — pasek ma zajmować tylko wysokość swojej zawartości, nigdy
      // nie rozlewać się na wolne miejsce rodzica (regres: zagnieżdżony w
      // pionowym ScrollView robił z chipów pionowe słupki).
      style={{ marginBottom: 16, marginHorizontal: -16, flexGrow: 0 }}
      // alignItems: 'flex-start' — chipy trzymają swoją naturalną wysokość i nie
      // rozciągają się w pionie, niezależnie od wysokości paska.
      // paddingHorizontal + wcięcie na start, żeby ostatni chip nie był ucinany
      // przez krawędź ekranu (wcześniej czwarty chip wychodził poza widok).
      contentContainerStyle={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        paddingHorizontal: 16,
        paddingBottom: 4,
      }}
      testID="balances-filter-bar"
    >
      {FILTERS.map(({ key, label }) => {
        const active = filter === key
        // Zerowy licznik → chip wyłączony (wejście w filtr dałoby pustą listę).
        // Wyjątek: chip aktualnie aktywny nie może się zablokować (licznik mógł
        // spaść do 0 już po wybraniu filtra) — inaczej zostałby zaznaczony
        // i nieklikalny naraz.
        const disabled = counts[key] === 0 && !active
        return (
          <Pressable
            key={key}
            testID={`balances-filter-${key}`}
            disabled={disabled}
            onPress={disabled ? undefined : () => onFilterChange(key)}
            style={({ pressed }) => [
              {
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: active ? `${Colors.accent}30` : Colors.card,
                borderWidth: 0.5,
                borderColor: active ? Colors.accent : Colors.border,
              },
              disabled && { opacity: 0.4 },
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
              {`${label} ${counts[key]}`}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
