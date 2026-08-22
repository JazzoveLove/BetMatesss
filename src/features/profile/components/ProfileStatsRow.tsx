import { Text, View } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import { formatBalance, getBalanceColor } from '@/shared/utils/money'
import { styles } from './styles/ProfileStatsRow.styles'

export type ProfileStatsRowProps = {
  totalMatches: number
  winRate: number
  balance: number
  hasStake: boolean
  isBalanceVisible: boolean
}

export function ProfileStatsRow({
  totalMatches,
  winRate,
  balance,
  hasStake,
  isBalanceVisible,
}: ProfileStatsRowProps) {
  const balanceText = !isBalanceVisible ? '—' : !hasStake ? 'bez stawki' : formatBalance(balance)
  const balanceColor = !isBalanceVisible || !hasStake ? Colors.textMuted : getBalanceColor(balance)
  const winRateText = totalMatches === 0 ? '—' : `${winRate}%`

  return (
    <View style={styles.statsRow}>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{winRateText}</Text>
        <Text style={styles.statLabel}>WIN RATE</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={[styles.statValue, { color: balanceColor }]}>{balanceText}</Text>
        <Text style={styles.statLabel}>BILANS</Text>
      </View>
    </View>
  )
}
