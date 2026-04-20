import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useHistory, type HistoryFilter } from '../hooks/useHistory'
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
    return <Text style={styles.amountMuted}>—</Text>
  }
  const positive = item.profit > 0
  const negative = item.profit < 0
  return (
    <Text
      style={[
        styles.amount,
        positive && styles.amountWin,
        negative && styles.amountLoss,
        item.profit === 0 && styles.amountNeutral,
      ]}
    >
      {item.amountLabel}
    </Text>
  )
}

export default function HistoryScreen() {
  const navigation = useNavigation<any>()
  const { loading, refreshing, items, filter, setFilter, onRefresh } = useHistory()

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
      <Text style={styles.title}>Historia</Text>
      <Text style={styles.subtitle}>Wszystkie zakłady, w których bierzesz udział</Text>

      <View style={styles.filterRow}>
        {(
          [
            { key: 'all' as const, label: 'Wszystkie' },
            { key: 'active' as const, label: 'Aktywne' },
            { key: 'completed' as const, label: 'Zakończone' },
          ] as const
        ).map(({ key, label }) => {
          const active = filter === key
          return (
            <TouchableOpacity
              key={key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilter(key)}
              activeOpacity={0.85}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Brak zakładów w tym widoku</Text>
        </View>
      ) : (
        items.map(item => {
          const game = GAME_MAP[item.gameTemplate] ?? { emoji: '🎲', label: item.gameTemplate }
          const badge = BADGE_UI[item.badge]
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => navigation.navigate('BetDetail', { betId: item.id })}
              activeOpacity={0.75}
            >
              <View style={styles.cardTop}>
                <Text style={styles.gameEmoji}>{game.emoji}</Text>
                <View style={styles.cardMain}>
                  <Text style={styles.gameName}>{game.label}</Text>
                  <Text style={styles.vs}>vs {item.opponentNick}</Text>
                  <Text style={styles.date}>{formatHistoryDate(item.createdAt)}</Text>
                </View>
                <AmountText item={item} />
              </View>
              <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
              </View>
            </TouchableOpacity>
          )
        })
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f1117' },
  content: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  centered: { flex: 1, backgroundColor: '#0f1117', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#e8e6e0', marginBottom: 6 },
  subtitle: { fontSize: 13, color: 'rgba(232,230,224,0.5)', marginBottom: 20 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#181c24',
    borderWidth: 0.5,
    borderColor: '#1e2330',
  },
  filterChipActive: { backgroundColor: '#534AB730', borderColor: '#534AB7' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: 'rgba(232,230,224,0.5)' },
  filterChipTextActive: { color: '#7F77DD' },
  empty: {
    backgroundColor: '#181c24',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#1e2330',
    padding: 28,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14, color: 'rgba(232,230,224,0.5)' },
  card: {
    backgroundColor: '#181c24',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#1e2330',
    padding: 14,
    marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  gameEmoji: { fontSize: 28 },
  cardMain: { flex: 1 },
  gameName: { fontSize: 15, fontWeight: '600', color: '#e8e6e0', marginBottom: 3 },
  vs: { fontSize: 13, color: 'rgba(232,230,224,0.5)', marginBottom: 4 },
  date: { fontSize: 12, color: 'rgba(232,230,224,0.35)' },
  amount: { fontSize: 15, fontWeight: '700', color: '#e8e6e0' },
  amountWin: { color: '#1D9E75' },
  amountLoss: { color: '#E24B4A' },
  amountNeutral: { color: 'rgba(232,230,224,0.5)' },
  amountMuted: { fontSize: 15, fontWeight: '600', color: 'rgba(232,230,224,0.35)' },
  badge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
})
