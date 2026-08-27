import { Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/shared/constants/colors'
import { formatBalance, getBalanceColor } from '@/shared/utils/money'
import type { BalanceSummary } from '@/features/balances/types/balance.types'
import { styles } from './styles/BalanceSummaryCard.styles'

export type BalanceSummaryCardProps = { summary: BalanceSummary }

export function BalanceSummaryCard({ summary }: BalanceSummaryCardProps) {
  if (summary.filter === 'zero') {
    return (
      <View style={styles.card}>
        <Text style={styles.zeroText}>
          {summary.filteredCount === 0
            ? 'Nikt nie jest z Tobą kwita'
            : `${summary.filteredCount} znajomych, z którymi jesteś kwita`}
        </Text>
      </View>
    )
  }

  if (summary.filter === 'all') {
    return (
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={[styles.iconBubble, { backgroundColor: Colors.cardAlt }]}>
            <Ionicons name="swap-horizontal-outline" size={16} color={Colors.textMuted} />
          </View>
          <Text style={styles.label}>RAZEM</Text>
        </View>
        <Text style={[styles.value, { color: getBalanceColor(summary.netSum) }]}>
          {formatBalance(summary.netSum)}
        </Text>
      </View>
    )
  }

  const positive = summary.filter === 'positive'
  const accentColor = positive ? Colors.green : Colors.red
  const filterLabel = positive ? 'NA PLUSIE' : 'NA MINUSIE'

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.iconBubble, { backgroundColor: `${accentColor}20` }]}>
          <Ionicons name={positive ? 'trending-up-outline' : 'trending-down-outline'} size={16} color={accentColor} />
        </View>
        <Text style={styles.label}>RAZEM · {filterLabel} ({summary.filteredCount})</Text>
      </View>
      {summary.filteredCount === 0 ? (
        <Text style={styles.emptyText}>Brak wyników dla tego filtra</Text>
      ) : (
        <Text style={[styles.value, { color: accentColor }]}>{formatBalance(summary.sum)}</Text>
      )}
    </View>
  )
}
