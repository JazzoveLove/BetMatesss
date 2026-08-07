import { Text, View } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import { formatBalance, getBalanceColor } from '@/shared/utils/money'
import { styles } from './styles/ProfileStatsRow.styles'

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
