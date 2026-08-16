import { Pressable, Text, View } from 'react-native'
import { GAME_MAP } from '@/shared/constants/games'
import { Colors } from '@/shared/constants/colors'
import { hexToRgba } from '@/shared/utils/colors'
import type { HistoryBadgeLabel, HistoryListItem as HistoryEntry } from '@/features/bets/types/bet.types'

const BADGE_UI: Record<HistoryBadgeLabel, { text: string; color: string; bg: string }> = {
  aktywny: { text: 'Aktywny', color: Colors.accentLight, bg: `${Colors.accentLight}18` },
  wygrany: { text: 'Wygrany', color: Colors.green, bg: `${Colors.green}18` },
  przegrany: { text: 'Przegrany', color: Colors.red, bg: `${Colors.red}18` },
  oczekuje: { text: 'Oczekuje', color: Colors.amber, bg: `${Colors.amber}18` },
  spór: { text: 'Spór', color: Colors.red, bg: `${Colors.red}18` },
  zakończony: { text: 'Zakończony', color: hexToRgba(Colors.text, 0.55), bg: Colors.cardAlt },
  odrzucony: { text: 'Odrzucony', color: Colors.red, bg: `${Colors.red}18` },
  anulowany: { text: 'Anulowany', color: hexToRgba(Colors.text, 0.55), bg: Colors.cardAlt },
}

function formatHistoryDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function AmountText({ item }: { item: HistoryEntry }) {
  if (item.amountLabel === '—') {
    return <Text style={{ fontSize: 15, fontWeight: '600', color: hexToRgba(Colors.text, 0.35) }}>—</Text>
  }
  const positive = item.profit > 0
  const negative = item.profit < 0
  return (
    <Text
      style={{
        fontSize: 15,
        fontWeight: '700',
        color: positive ? Colors.green : negative ? Colors.red : Colors.textMuted,
      }}
    >
      {item.amountLabel}
    </Text>
  )
}

export type HistoryListItemProps = {
  item: HistoryEntry
  onPress: (id: string) => void
}

export function HistoryListItem({ item, onPress }: HistoryListItemProps) {
  const game = GAME_MAP[item.gameTemplate] ?? { emoji: '🎲', label: item.gameTemplate }
  const badge = BADGE_UI[item.badge]
  return (
    <Pressable
      onPress={() => onPress(item.id)}
      style={({ pressed }) => [
        {
          backgroundColor: Colors.card,
          borderRadius: 14,
          borderWidth: 0.5,
          borderColor: Colors.border,
          padding: 14,
          marginBottom: 10,
        },
        pressed && { opacity: 0.75 },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <Text style={{ fontSize: 28 }}>{game.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 3 }}>{game.label}</Text>
          <Text style={{ fontSize: 13, color: Colors.textMuted, marginBottom: 4 }}>
            vs {item.opponentNick}
          </Text>
          <Text style={{ fontSize: 12, color: hexToRgba(Colors.text, 0.35) }}>{formatHistoryDate(item.createdAt)}</Text>
        </View>
        <AmountText item={item} />
      </View>
      <View
        style={{
          alignSelf: 'flex-start',
          borderRadius: 20,
          paddingHorizontal: 10,
          paddingVertical: 4,
          backgroundColor: badge.bg,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '700', color: badge.color }}>{badge.text}</Text>
      </View>
    </Pressable>
  )
}
