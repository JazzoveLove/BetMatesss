import { ActivityIndicator, RefreshControl } from 'react-native'
import { ScrollView, YStack, XStack, Text, Button } from 'tamagui'
import { useNavigation } from '@react-navigation/native'
import { useDashboard } from '../hooks/useDashboard'
import { useAuth } from '../hooks/useAuth'
import { formatBalance, balanceHighlight } from '../utils/settlements'
import StatCard from '../components/StatCard'
import BetCard from '../components/BetCard'
import { GAME_MAP } from '../constants/games'

export default function DashboardScreen() {
  const navigation = useNavigation<any>()
  const { signOut } = useAuth()
  const { loading, refreshing, nick, stats, activeBets, recentResults, onRefresh } = useDashboard()

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
      <XStack style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <YStack>
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#e8e6e0' }}>Cześć, {nick} 👋</Text>
          <Text style={{ fontSize: 13, color: 'rgba(232,230,224,0.5)', marginTop: 3 }}>
            Twoje zakłady ze znajomymi
          </Text>
        </YStack>
        <Button
          chromeless
          onPress={() => signOut()}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderRadius: 8,
            borderWidth: 0.5,
            borderColor: '#1e2330',
            backgroundColor: 'transparent',
          }}
        >
          <Text style={{ fontSize: 13, color: 'rgba(232,230,224,0.5)' }}>Wyloguj</Text>
        </Button>
      </XStack>

      <XStack style={{ flexDirection: 'row', gap: 10, marginBottom: 32 }}>
        <StatCard
          label="Bilans"
          value={formatBalance(stats.balance)}
          highlight={balanceHighlight(stats.balance)}
        />
        <StatCard label="Zakłady" value={String(stats.totalBets)} />
        <StatCard
          label="Win Rate"
          value={`${stats.winRate}%`}
          highlight={stats.winRate >= 50 ? 'positive' : stats.winRate > 0 ? 'negative' : 'neutral'}
        />
      </XStack>

      <YStack style={{ marginBottom: 32 }}>
        <XStack style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#e8e6e0' }}>Aktywne zakłady</Text>
          {activeBets.length > 0 && (
            <YStack
              style={{
                backgroundColor: '#534AB720',
                borderRadius: 20,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <Text style={{ fontSize: 12, color: '#7F77DD', fontWeight: '600' }}>{activeBets.length}</Text>
            </YStack>
          )}
        </XStack>

        {activeBets.length === 0 ? (
          <YStack
            style={{
              backgroundColor: '#181c24',
              borderRadius: 14,
              borderWidth: 0.5,
              borderColor: '#1e2330',
              padding: 24,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 14, color: 'rgba(232,230,224,0.5)', marginBottom: 4 }}>
              Brak aktywnych zakładów
            </Text>
            <Text style={{ fontSize: 12, color: '#534AB7' }}>Dodaj pierwszy zakład ze znajomym</Text>
          </YStack>
        ) : (
          activeBets.map(bet => (
            <BetCard
              key={bet.id}
              gameTemplate={bet.gameTemplate}
              opponentNick={bet.opponentNick}
              stakeAmount={bet.stakeAmount}
              odds={bet.odds}
              status={bet.status}
              onPress={() => navigation.navigate('BetDetail', { betId: bet.id })}
            />
          ))
        )}
      </YStack>

      <YStack style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#e8e6e0', marginBottom: 12 }}>Ostatnie wyniki</Text>

        {recentResults.length === 0 ? (
          <YStack
            style={{
              backgroundColor: '#181c24',
              borderRadius: 14,
              borderWidth: 0.5,
              borderColor: '#1e2330',
              padding: 24,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 14, color: 'rgba(232,230,224,0.5)' }}>Brak rozegranych zakładów</Text>
          </YStack>
        ) : (
          recentResults.map(r => (
            <XStack
              key={r.id}
              onPress={() => navigation.navigate('BetDetail', { betId: r.id })}
              pressStyle={{ opacity: 0.75 }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#181c24',
                borderRadius: 14,
                borderWidth: 0.5,
                borderColor: '#1e2330',
                marginBottom: 10,
                overflow: 'hidden',
              }}
            >
              <YStack
                style={{
                  width: 4,
                  alignSelf: 'stretch',
                  backgroundColor: r.profit >= 0 ? '#1D9E75' : '#E24B4A',
                }}
              />
              <YStack flex={1} style={{ paddingVertical: 14, paddingHorizontal: 14 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#e8e6e0', marginBottom: 3 }}>
                  {GAME_MAP[r.gameTemplate]?.label ?? r.gameTemplate}
                </Text>
                <Text style={{ fontSize: 12, color: 'rgba(232,230,224,0.5)' }}>vs {r.opponentNick}</Text>
              </YStack>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  paddingRight: 16,
                  color: r.profit >= 0 ? '#1D9E75' : '#E24B4A',
                }}
              >
                {r.profit >= 0 ? '+' : ''}
                {r.profit} zł
              </Text>
            </XStack>
          ))
        )}
      </YStack>
    </ScrollView>
  )
}
