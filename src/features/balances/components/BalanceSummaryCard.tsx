import type { ReactNode } from 'react'
import { Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/shared/constants/colors'
import { formatBalance, getBalanceColor } from '@/shared/utils/money'
import type { BalanceSummary } from '@/features/balances/types/balance.types'
import { styles } from './styles/BalanceSummaryCard.styles'

export type BalanceSummaryCardProps = {
  summary: BalanceSummary
  /**
   * Wszyscy znajomi mają saldo 0 (STAN B). Musi być przekazane jawnie —
   * `netSum === 0` nie wystarcza, bo +50 i −50 też sumuje się do zera, a to
   * nie znaczy "wszystko rozliczone".
   */
  allSettled?: boolean
}

type CardContent = {
  label: string
  iconName: keyof typeof Ionicons.glyphMap
  iconColor: string
  iconBg: string
  value: ReactNode
  subtitle?: string
}

function buildContent(summary: BalanceSummary, allSettled: boolean): CardContent {
  if (summary.filter === 'positive') {
    return {
      label: 'RAZEM NA PLUSIE',
      iconName: 'trending-up-outline',
      iconColor: Colors.green,
      iconBg: `${Colors.green}20`,
      value:
        summary.filteredCount === 0 ? (
          <Text style={styles.emptyText}>Brak wyników dla tego filtra</Text>
        ) : (
          <Text style={[styles.value, { color: Colors.green }]}>{formatBalance(summary.sum)}</Text>
        ),
    }
  }

  if (summary.filter === 'negative') {
    return {
      label: 'RAZEM NA MINUSIE',
      iconName: 'trending-down-outline',
      iconColor: Colors.red,
      iconBg: `${Colors.red}20`,
      value:
        summary.filteredCount === 0 ? (
          <Text style={styles.emptyText}>Brak wyników dla tego filtra</Text>
        ) : (
          <Text style={[styles.value, { color: Colors.red }]}>{formatBalance(summary.sum)}</Text>
        ),
    }
  }

  if (summary.filter === 'zero') {
    return {
      label: 'ROZLICZENI',
      iconName: 'checkmark-circle-outline',
      iconColor: Colors.green,
      iconBg: `${Colors.green}20`,
      // Dla tego filtra kwota nie niesie informacji — pokazujemy liczbę osób.
      value: <Text style={[styles.value, { color: Colors.text }]}>{summary.filteredCount}</Text>,
    }
  }

  return {
    label: 'RAZEM',
    iconName: allSettled ? 'checkmark-circle' : 'swap-horizontal-outline',
    iconColor: allSettled ? Colors.green : Colors.textMuted,
    iconBg: allSettled ? `${Colors.green}20` : Colors.cardAlt,
    value: (
      <Text style={[styles.value, { color: getBalanceColor(summary.netSum) }]}>{formatBalance(summary.netSum)}</Text>
    ),
    subtitle: allSettled ? 'Wszystko rozliczone' : undefined,
  }
}

export function BalanceSummaryCard({ summary, allSettled = false }: BalanceSummaryCardProps) {
  const content = buildContent(summary, allSettled)

  return (
    <View style={styles.card} testID="balances-summary-card">
      <View style={styles.topRow}>
        <View style={[styles.iconBubble, { backgroundColor: content.iconBg }]}>
          <Ionicons name={content.iconName} size={16} color={content.iconColor} />
        </View>
        <Text style={styles.label}>{content.label}</Text>
      </View>
      {content.value}
      {content.subtitle ? <Text style={styles.subtitle}>{content.subtitle}</Text> : null}
    </View>
  )
}
