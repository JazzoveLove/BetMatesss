import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
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
      <View style={styles.centered}>
        <ActivityIndicator color="#7F77DD" size="large" />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Cześć, {nick} 👋</Text>
          <Text style={styles.subtitle}>Twoje zakłady ze znajomymi</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => signOut()}>
          <Text style={styles.logoutText}>Wyloguj</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
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
      </View>

      {/* Active bets */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Aktywne zakłady</Text>
          {activeBets.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{activeBets.length}</Text>
            </View>
          )}
        </View>

        {activeBets.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Brak aktywnych zakładów</Text>
            <Text style={styles.emptyHint}>Dodaj pierwszy zakład ze znajomym</Text>
          </View>
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
      </View>

      {/* Recent results */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ostatnie wyniki</Text>

        {recentResults.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Brak rozegranych zakładów</Text>
          </View>
        ) : (
          recentResults.map(r => (
            <TouchableOpacity
              key={r.id}
              style={styles.resultCard}
              onPress={() => navigation.navigate('BetDetail', { betId: r.id })}
              activeOpacity={0.75}
            >
              <View style={[styles.resultBar, r.profit >= 0 ? styles.barWin : styles.barLoss]} />
              <View style={styles.resultBody}>
                <Text style={styles.resultGame}>
                  {GAME_MAP[r.gameTemplate]?.label ?? r.gameTemplate}
                </Text>
                <Text style={styles.resultOpponent}>vs {r.opponentNick}</Text>
              </View>
              <Text style={[styles.resultProfit, r.profit >= 0 ? styles.profitWin : styles.profitLoss]}>
                {r.profit >= 0 ? '+' : ''}{r.profit} zł
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f1117' },
  content: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  centered: { flex: 1, backgroundColor: '#0f1117', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#e8e6e0' },
  subtitle: { fontSize: 13, color: 'rgba(232,230,224,0.5)', marginTop: 3 },
  logoutBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 0.5, borderColor: '#1e2330' },
  logoutText: { fontSize: 13, color: 'rgba(232,230,224,0.5)' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#e8e6e0', marginBottom: 12 },
  countBadge: { backgroundColor: '#534AB720', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 12 },
  countText: { fontSize: 12, color: '#7F77DD', fontWeight: '600' },
  empty: { backgroundColor: '#181c24', borderRadius: 14, borderWidth: 0.5, borderColor: '#1e2330', padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, color: 'rgba(232,230,224,0.5)', marginBottom: 4 },
  emptyHint: { fontSize: 12, color: '#534AB7' },
  resultCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#181c24', borderRadius: 14, borderWidth: 0.5, borderColor: '#1e2330', marginBottom: 10, overflow: 'hidden' },
  resultBar: { width: 4, alignSelf: 'stretch' },
  barWin: { backgroundColor: '#1D9E75' },
  barLoss: { backgroundColor: '#E24B4A' },
  resultBody: { flex: 1, paddingVertical: 14, paddingHorizontal: 14 },
  resultGame: { fontSize: 13, fontWeight: '600', color: '#e8e6e0', marginBottom: 3 },
  resultOpponent: { fontSize: 12, color: 'rgba(232,230,224,0.5)' },
  resultProfit: { fontSize: 15, fontWeight: '700', paddingRight: 16 },
  profitWin: { color: '#1D9E75' },
  profitLoss: { color: '#E24B4A' },
})
