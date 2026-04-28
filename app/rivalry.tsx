import { ActivityIndicator, RefreshControl } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { ScrollView, YStack, XStack, Text, Button } from 'tamagui'
import { useRivalry } from '../hooks/useRivalry'
import { Colors } from '../constants/colors'
import { GAME_MAP } from '../constants/games'

type RivalryRouteParams = {
  friendId: string
  gameTemplate?: string
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function RivalryScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute()
  const { friendId, gameTemplate } = (route.params ?? {}) as RivalryRouteParams
  const {
    loading,
    refreshing,
    error,
    friendNick,
    disciplines,
    selectedDiscipline,
    setSelectedDiscipline,
    filteredMatches,
    statsByDiscipline,
    totals,
    onRefresh,
  } = useRivalry(friendId, gameTemplate)

  if (loading) {
    return (
      <YStack flex={1} style={{ backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.accentLight} size="large" />
      </YStack>
    )
  }

  return (
    <ScrollView
      flex={1}
      style={{ backgroundColor: Colors.background }}
      contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 40 } as any}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.accentLight}
          colors={[Colors.accentLight]}
        />
      }
    >
      <XStack style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Button chromeless onPress={() => navigation.goBack()}>
          <Text style={{ color: Colors.accentLight, fontSize: 14, fontWeight: '700' }}>Wroc</Text>
        </Button>
        <Text style={{ fontSize: 21, fontWeight: '700', color: Colors.text }}>Ty vs {friendNick}</Text>
        <YStack style={{ width: 44 }} />
      </XStack>

      {error ? (
        <YStack style={{ backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <Text style={{ color: Colors.red, fontSize: 13 }}>{error}</Text>
        </YStack>
      ) : null}

      <XStack style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <Button
          onPress={() => setSelectedDiscipline(null)}
          style={{
            borderRadius: 999,
            height: 34,
            backgroundColor: selectedDiscipline == null ? Colors.accent : Colors.card,
            borderWidth: 0.5,
            borderColor: Colors.cardAlt,
            paddingHorizontal: 12,
          }}
        >
          <Text style={{ color: Colors.text, fontSize: 12, fontWeight: '600' }}>Wszystkie</Text>
        </Button>
        {disciplines.map(template => (
          <Button
            key={template}
            onPress={() => setSelectedDiscipline(template)}
            style={{
              borderRadius: 999,
              height: 34,
              backgroundColor: selectedDiscipline === template ? Colors.accent : Colors.card,
              borderWidth: 0.5,
              borderColor: Colors.cardAlt,
              paddingHorizontal: 12,
            }}
          >
            <Text style={{ color: Colors.text, fontSize: 12, fontWeight: '600' }}>
              {GAME_MAP[template]?.label ?? template}
            </Text>
          </Button>
        ))}
      </XStack>

      <YStack
        style={{
          backgroundColor: Colors.card,
          borderRadius: 14,
          borderWidth: 0.5,
          borderColor: Colors.cardAlt,
          padding: 14,
          marginBottom: 16,
          gap: 8,
        }}
      >
        <Text style={{ color: Colors.text, fontSize: 16, fontWeight: '700' }}>Statystyki ogolne</Text>
        <Text style={{ color: Colors.textMuted, fontSize: 13 }}>
          W/L: {totals.wins}/{totals.losses} | Win rate: {totals.winRatePct}%
        </Text>
        <Text style={{ color: totals.balance >= 0 ? Colors.green : Colors.red, fontSize: 14, fontWeight: '700' }}>
          Bilans: {totals.balance > 0 ? '+' : ''}
          {totals.balance} zl
        </Text>
      </YStack>

      {selectedDiscipline == null && statsByDiscipline.length > 0 ? (
        <YStack style={{ marginBottom: 16, gap: 8 }}>
          {statsByDiscipline.map(row => (
            <XStack
              key={row.gameTemplate}
              style={{
                backgroundColor: Colors.card,
                borderRadius: 12,
                borderWidth: 0.5,
                borderColor: Colors.cardAlt,
                padding: 12,
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ color: Colors.text, fontSize: 13 }}>
                {GAME_MAP[row.gameTemplate]?.emoji ?? '🎮'} {GAME_MAP[row.gameTemplate]?.label ?? row.gameTemplate}
              </Text>
              <Text style={{ color: Colors.textMuted, fontSize: 13 }}>
                {row.wins}W / {row.losses}L
              </Text>
            </XStack>
          ))}
        </YStack>
      ) : null}

      <YStack style={{ gap: 8 }}>
        {filteredMatches.map(match => (
          <YStack
            key={match.betId}
            style={{
              backgroundColor: Colors.card,
              borderRadius: 12,
              borderWidth: 0.5,
              borderColor: Colors.cardAlt,
              borderLeftWidth: 4,
              borderLeftColor:
                match.outcome === 'win'
                  ? Colors.green
                  : match.outcome === 'loss'
                  ? Colors.red
                  : Colors.textMuted,
              padding: 12,
            }}
          >
            <XStack style={{ justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: Colors.text, fontSize: 14, fontWeight: '600' }}>
                {GAME_MAP[match.gameTemplate]?.emoji ?? '🎮'} {GAME_MAP[match.gameTemplate]?.label ?? match.gameTemplate}
              </Text>
              <Text style={{ color: Colors.textMuted, fontSize: 12 }}>{formatDate(match.createdAt)}</Text>
            </XStack>
            <Text style={{ color: Colors.textMuted, fontSize: 12, marginBottom: 4 }}>
              Wynik: {match.score ?? 'Brak'} | Stawka: {match.stakeAmount} zl
            </Text>
            <Text style={{ color: match.profit >= 0 ? Colors.green : Colors.red, fontWeight: '700', fontSize: 13 }}>
              {match.profit > 0 ? '+' : ''}
              {match.profit} zl
            </Text>
          </YStack>
        ))}
        {filteredMatches.length === 0 ? (
          <YStack style={{ backgroundColor: Colors.card, borderRadius: 12, padding: 14 }}>
            <Text style={{ color: Colors.textMuted, fontSize: 13 }}>
              Brak meczow dla wybranych filtrow.
            </Text>
          </YStack>
        ) : null}
      </YStack>
    </ScrollView>
  )
}
