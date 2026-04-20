import { ActivityIndicator, RefreshControl } from 'react-native'
import { ScrollView, YStack, XStack, Text, Button } from 'tamagui'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../hooks/useAuth'
import { GAME_MAP } from '../constants/games'
import StatCard from '../components/StatCard'
import { formatBalance, balanceHighlight } from '../utils/settlements'

function initialsFromNick(nick: string): string {
  const parts = nick.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatJoined(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export default function ProfileScreen() {
  const { signOut } = useAuth()
  const { loading, refreshing, data, onRefresh } = useProfile()

  if (loading || !data) {
    return (
      <YStack flex={1} style={{ backgroundColor: '#0f1117', justifyContent: 'center', alignItems: 'center' }}>
        {loading ? (
          <ActivityIndicator color="#7F77DD" size="large" />
        ) : (
          <Text style={{ fontSize: 14, color: 'rgba(232,230,224,0.5)', textAlign: 'center' }}>
            Nie udało się wczytać profilu.
          </Text>
        )}
      </YStack>
    )
  }

  const { nick, createdAt, stats, disciplines, friendsRank } = data

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
      <XStack style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <YStack
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: '#534AB730',
            borderWidth: 0.5,
            borderColor: '#534AB7',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#7F77DD' }}>{initialsFromNick(nick)}</Text>
        </YStack>
        <YStack flex={1}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#e8e6e0', marginBottom: 4 }}>{nick}</Text>
          <Text style={{ fontSize: 13, color: 'rgba(232,230,224,0.5)' }}>
            Dołączył(a): {formatJoined(createdAt)}
          </Text>
        </YStack>
      </XStack>

      <XStack style={{ flexDirection: 'row', gap: 10, marginBottom: 28 }}>
        <StatCard
          label="Bilans"
          value={formatBalance(stats.balance)}
          highlight={balanceHighlight(stats.balance)}
        />
        <StatCard label="Zakłady" value={String(stats.totalBets)} />
        <StatCard
          label="Win rate"
          value={`${stats.winRate}%`}
          highlight={stats.winRate >= 50 ? 'positive' : stats.winRate > 0 ? 'negative' : 'neutral'}
        />
      </XStack>

      <Text style={{ fontSize: 16, fontWeight: '600', color: '#e8e6e0', marginBottom: 12 }}>
        Wyniki wg dyscypliny
      </Text>
      {disciplines.length === 0 ? (
        <YStack
          style={{
            backgroundColor: '#181c24',
            borderRadius: 14,
            borderWidth: 0.5,
            borderColor: '#1e2330',
            padding: 20,
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 14, color: 'rgba(232,230,224,0.5)', textAlign: 'center' }}>
            Brak rozliczonych zakładów z wynikiem W/L
          </Text>
        </YStack>
      ) : (
        <YStack
          style={{
            backgroundColor: '#181c24',
            borderRadius: 14,
            borderWidth: 0.5,
            borderColor: '#1e2330',
            marginBottom: 28,
            overflow: 'hidden',
          }}
        >
          <XStack
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 10,
              paddingHorizontal: 12,
              backgroundColor: '#1e2330',
            }}
          >
            <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: 'rgba(232,230,224,0.45)', textTransform: 'uppercase' }}>
              Dyscyplina
            </Text>
            <Text
              style={{
                width: 56,
                textAlign: 'right',
                fontSize: 11,
                fontWeight: '700',
                color: 'rgba(232,230,224,0.45)',
                textTransform: 'uppercase',
              }}
            >
              W/L
            </Text>
            <Text
              style={{
                width: 56,
                textAlign: 'right',
                fontSize: 11,
                fontWeight: '700',
                color: 'rgba(232,230,224,0.45)',
                textTransform: 'uppercase',
              }}
            >
              %
            </Text>
          </XStack>
          {disciplines.map(row => {
            const game = GAME_MAP[row.gameTemplate] ?? { emoji: '🎲', label: row.gameTemplate }
            return (
              <XStack
                key={row.gameTemplate}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderTopWidth: 0.5,
                  borderTopColor: '#1e2330',
                }}
              >
                <XStack flex={1} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 18 }}>{game.emoji}</Text>
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#e8e6e0' }} numberOfLines={1}>
                    {game.label}
                  </Text>
                </XStack>
                <Text
                  style={{
                    width: 56,
                    textAlign: 'right',
                    fontSize: 14,
                    color: '#e8e6e0',
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {row.wins}/{row.losses}
                </Text>
                <Text
                  style={{
                    width: 56,
                    textAlign: 'right',
                    fontSize: 14,
                    fontWeight: '700',
                    color: '#7F77DD',
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {row.winPct}%
                </Text>
              </XStack>
            )
          })}
        </YStack>
      )}

      <Text style={{ fontSize: 16, fontWeight: '600', color: '#e8e6e0', marginBottom: 12 }}>
        Znajomi — ranking (bilans)
      </Text>
      {friendsRank.length === 0 ? (
        <YStack
          style={{
            backgroundColor: '#181c24',
            borderRadius: 14,
            borderWidth: 0.5,
            borderColor: '#1e2330',
            padding: 20,
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 14, color: 'rgba(232,230,224,0.5)', textAlign: 'center' }}>
            Dodaj znajomych, żeby zobaczyć ranking
          </Text>
        </YStack>
      ) : (
        friendsRank.map((f, index) => (
          <XStack
            key={f.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#181c24',
              borderRadius: 12,
              borderWidth: 0.5,
              borderColor: '#1e2330',
              padding: 14,
              marginBottom: 8,
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#534AB7', width: 24 }}>{index + 1}</Text>
            <YStack flex={1}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#e8e6e0' }}>{f.nick}</Text>
            </YStack>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: f.balance > 0 ? '#1D9E75' : f.balance < 0 ? '#E24B4A' : '#e8e6e0',
              }}
            >
              {formatBalance(f.balance)}
            </Text>
          </XStack>
        ))
      )}

      <Button
        chromeless
        onPress={() => void signOut()}
        style={{
          marginTop: 16,
          backgroundColor: '#1e2330',
          borderRadius: 12,
          paddingVertical: 16,
          alignItems: 'center',
          borderWidth: 0.5,
          borderColor: '#1e2330',
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: '600', color: 'rgba(232,230,224,0.6)' }}>Wyloguj</Text>
      </Button>
    </ScrollView>
  )
}
