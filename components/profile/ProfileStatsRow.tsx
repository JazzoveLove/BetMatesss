import { StyleSheet, Text, View } from 'react-native'
import { Colors } from '../../constants/colors'
import { formatBalance, getBalanceColor } from '../../utils/money'

export type ProfileStatsRowProps = {
  totalMatches: number
  winRate: number
  balance: number
  isBalanceVisible: boolean
}

export function ProfileStatsRow({
  totalMatches,
  winRate,
  balance,
  isBalanceVisible,
}: ProfileStatsRowProps) {
  const balanceText = isBalanceVisible ? formatBalance(balance) : '—'
  const balanceColor = isBalanceVisible ? getBalanceColor(balance) : Colors.textMuted

  return (
    <View style={styles.statsRow}>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{totalMatches}</Text>
        <Text style={styles.statLabel}>MECZE</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{winRate}%</Text>
        <Text style={styles.statLabel}>WIN RATE</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={[styles.statValue, { color: balanceColor }]}>{balanceText}</Text>
        <Text style={styles.statLabel}>BILANS</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  statsRow: { marginHorizontal: 16, flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    paddingVertical: 12,
  },
  statValue: { color: Colors.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  statLabel: {
    marginTop: 4,
    color: Colors.textMuted,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
})
