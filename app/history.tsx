import { ActivityIndicator, RefreshControl } from 'react-native'
import { ScrollView, YStack, XStack, Text } from 'tamagui'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useHistory } from '../hooks/useHistory'
import { GAME_MAP } from '../constants/games'
import type { HistoryBadgeLabel, HistoryListItem } from '../types/bet.types'

const BADGE_UI: Record<
  HistoryBadgeLabel,
  { text: string; color: string; bg: string }
> = {
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

function AmountText({ item }: { item: HistoryListItem }) {
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

export default function HistoryScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const initialFilter = route.params?.initialFilter === 'active' ? 'active' : 'all'
  const { loading, refreshing, items, filter, setFilter, onRefresh } = useHistory(initialFilter)

  if (loading) {
    return (
      <YStack flex={1} style={{ backgroundColor: '#0f1117', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#7F77DD" size="large" />
      </YStack>
    )
  }

  return (
    <ScrollView
      flex={1}
      style={{ backgroundColor: '#0f1117' }}
      contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 40 } as any}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#7F77DD"
          colors={['#7F77DD']}
        />
      }
    >
      <Text style={{ fontSize: 22, fontWeight: '700', color: '#e8e6e0', marginBottom: 6 }}>Historia</Text>
      <Text style={{ fontSize: 13, color: 'rgba(232,230,224,0.5)', marginBottom: 20 }}>
        Wszystkie zakłady, w których bierzesz udział
      </Text>

      <XStack style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {(
          [
            { key: 'all' as const, label: 'Wszystkie' },
            { key: 'active' as const, label: 'Aktywne' },
            { key: 'completed' as const, label: 'Zakończone' },
          ] as const
        ).map(({ key, label }) => {
          const active = filter === key
          return (
            <YStack
              key={key}
              onPress={() => setFilter(key)}
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

      {items.length === 0 ? (
        <YStack
          style={{
            backgroundColor: '#181c24',
            borderRadius: 14,
            borderWidth: 0.5,
            borderColor: '#1e2330',
            padding: 28,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 14, color: 'rgba(232,230,224,0.5)' }}>Brak zakładów w tym widoku</Text>
        </YStack>
      ) : (
        items.map(item => {
          const game = GAME_MAP[item.gameTemplate] ?? { emoji: '🎲', label: item.gameTemplate }
          const badge = BADGE_UI[item.badge]
          return (
            <YStack
              key={item.id}
              onPress={() => navigation.navigate('BetDetail', { betId: item.id })}
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
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#e8e6e0', marginBottom: 3 }}>
                    {game.label}
                  </Text>
                  <Text style={{ fontSize: 13, color: 'rgba(232,230,224,0.5)', marginBottom: 4 }}>
                    vs {item.opponentNick}
                  </Text>
                  <Text style={{ fontSize: 12, color: 'rgba(232,230,224,0.35)' }}>
                    {formatHistoryDate(item.createdAt)}
                  </Text>
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
        })
      )}
    </ScrollView>
  )
}
