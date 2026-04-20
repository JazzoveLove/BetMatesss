import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
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
      <View style={styles.centered}>
        {loading ? <ActivityIndicator color="#7F77DD" size="large" /> : (
          <Text style={styles.muted}>Nie udało się wczytać profilu.</Text>
        )}
      </View>
    )
  }

  const { nick, createdAt, stats, disciplines, friendsRank } = data

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
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initialsFromNick(nick)}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.nick}>{nick}</Text>
          <Text style={styles.joined}>Dołączył(a): {formatJoined(createdAt)}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
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
      </View>

      <Text style={styles.sectionTitle}>Wyniki wg dyscypliny</Text>
      {disciplines.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.muted}>Brak rozliczonych zakładów z wynikiem W/L</Text>
        </View>
      ) : (
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.thGame]}>Dyscyplina</Text>
            <Text style={styles.th}>W/L</Text>
            <Text style={styles.th}>%</Text>
          </View>
          {disciplines.map(row => {
            const game = GAME_MAP[row.gameTemplate] ?? { emoji: '🎲', label: row.gameTemplate }
            return (
              <View key={row.gameTemplate} style={styles.tableRow}>
                <View style={styles.disciplineCell}>
                  <Text style={styles.discEmoji}>{game.emoji}</Text>
                  <Text style={styles.discName} numberOfLines={1}>
                    {game.label}
                  </Text>
                </View>
                <Text style={styles.wl}>
                  {row.wins}/{row.losses}
                </Text>
                <Text style={styles.pct}>{row.winPct}%</Text>
              </View>
            )
          })}
        </View>
      )}

      <Text style={styles.sectionTitle}>Znajomi — ranking (bilans)</Text>
      {friendsRank.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.muted}>Dodaj znajomych, żeby zobaczyć ranking</Text>
        </View>
      ) : (
        friendsRank.map((f, index) => (
          <View key={f.id} style={styles.friendRow}>
            <Text style={styles.rankNum}>{index + 1}</Text>
            <View style={styles.friendMid}>
              <Text style={styles.friendNick}>{f.nick}</Text>
            </View>
            <Text
              style={[
                styles.friendBalance,
                f.balance > 0 && styles.amountWin,
                f.balance < 0 && styles.amountLoss,
              ]}
            >
              {formatBalance(f.balance)}
            </Text>
          </View>
        ))
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={() => void signOut()} activeOpacity={0.85}>
        <Text style={styles.logoutText}>Wyloguj</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f1117' },
  content: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  centered: { flex: 1, backgroundColor: '#0f1117', justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 28 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#534AB730',
    borderWidth: 0.5,
    borderColor: '#534AB7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#7F77DD' },
  headerText: { flex: 1 },
  nick: { fontSize: 22, fontWeight: '700', color: '#e8e6e0', marginBottom: 4 },
  joined: { fontSize: 13, color: 'rgba(232,230,224,0.5)' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#e8e6e0', marginBottom: 12 },
  emptyBox: {
    backgroundColor: '#181c24',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#1e2330',
    padding: 20,
    marginBottom: 24,
  },
  muted: { fontSize: 14, color: 'rgba(232,230,224,0.5)', textAlign: 'center' },
  table: {
    backgroundColor: '#181c24',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#1e2330',
    marginBottom: 28,
    overflow: 'hidden',
  },
  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#1e2330' },
  th: { fontSize: 11, fontWeight: '700', color: 'rgba(232,230,224,0.45)', textTransform: 'uppercase', width: 56, textAlign: 'right' },
  thGame: { flex: 1, textAlign: 'left', width: undefined },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#1e2330',
  },
  disciplineCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  discEmoji: { fontSize: 18 },
  discName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#e8e6e0' },
  wl: { width: 56, textAlign: 'right', fontSize: 14, color: '#e8e6e0', fontVariant: ['tabular-nums'] },
  pct: { width: 56, textAlign: 'right', fontSize: 14, fontWeight: '700', color: '#7F77DD', fontVariant: ['tabular-nums'] },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181c24',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#1e2330',
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  rankNum: { fontSize: 14, fontWeight: '700', color: '#534AB7', width: 24 },
  friendMid: { flex: 1 },
  friendNick: { fontSize: 15, fontWeight: '600', color: '#e8e6e0' },
  friendBalance: { fontSize: 14, fontWeight: '700', color: '#e8e6e0' },
  amountWin: { color: '#1D9E75' },
  amountLoss: { color: '#E24B4A' },
  logoutBtn: {
    marginTop: 16,
    backgroundColor: '#1e2330',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#1e2330',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: 'rgba(232,230,224,0.6)' },
})
