import { XStack, YStack, Text } from 'tamagui'
import { GAME_MAP } from '../../constants/games'
import type { HistoryBadgeLabel, HistoryListItem as HistoryEntry } from '../../types/bet.types'

const BADGE_UI: Record<HistoryBadgeLabel, { text: string; color: string; bg: string }> = {
  aktywny: { text: 'Aktywny', color: '#7F77DD', bg: '#7F77DD18' },
  wygrany: { text: 'Wygrany', color: '#1D9E75', bg: '#1D9E7518' },
  przegrany: { text: 'Przegrany', color: '#E24B4A', bg: '#E24B4A18' },
  oczekuje: { text: 'Oczekuje', color: '#EF9F27', bg: '#EF9F2718' },
  spór: { text: 'Spór', color: '#E24B4A', bg: '#E24B4A18' },
  zakończony: { text: 'Zakończony', color: 'rgba(232,230,224,0.55)', bg: '#1e2330' },
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
    return <Text style={{ fontSize: 15, fontWeight: '600', color: 'rgba(232,230,224,0.35)' }}>—</Text>
  }
  const positive = item.profit > 0
  const negative = item.profit < 0
  return (
    <Text
      style={{
        fontSize: 15,
        fontWeight: '700',
        color: positive ? '#1D9E75' : negative ? '#E24B4A' : 'rgba(232,230,224,0.5)',
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
    <YStack
      onPress={() => onPress(item.id)}
      pressStyle={{ opacity: 0.75 }}
      style={{
        backgroundColor: '#181c24',
        borderRadius: 14,
        borderWidth: 0.5,
        borderColor: '#1e2330',
        padding: 14,
        marginBottom: 10,
      }}
    >
      <XStack style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <Text style={{ fontSize: 28 }}>{game.emoji}</Text>
        <YStack flex={1}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#e8e6e0', marginBottom: 3 }}>{game.label}</Text>
          <Text style={{ fontSize: 13, color: 'rgba(232,230,224,0.5)', marginBottom: 4 }}>
            vs {item.opponentNick}
          </Text>
          <Text style={{ fontSize: 12, color: 'rgba(232,230,224,0.35)' }}>{formatHistoryDate(item.createdAt)}</Text>
        </YStack>
        <AmountText item={item} />
      </XStack>
      <YStack
        style={{
          alignSelf: 'flex-start',
          borderRadius: 20,
          paddingHorizontal: 10,
          paddingVertical: 4,
          backgroundColor: badge.bg,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '700', color: badge.color }}>{badge.text}</Text>
      </YStack>
    </YStack>
  )
}
