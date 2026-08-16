import type { ComponentProps } from 'react'
import { Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/shared/constants/colors'
import type { ProfileDisciplineStat } from '@/features/bets/types/bet.types'
import { formatBalance, getBalanceColor } from '@/shared/utils/money'
import { styles } from './styles/StatsSectionCard.styles'

export type StatsSectionCardProps = {
  title: string
  icon: ComponentProps<typeof Ionicons>['name']
  wins: number
  losses: number
  winrate: number
  balance?: number
  disciplines?: ProfileDisciplineStat[]
}

export function StatsSectionCard({
  title,
  icon,
  wins,
  losses,
  winrate,
  balance,
}: StatsSectionCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Ionicons name={icon} size={16} color={Colors.text} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.row}>
        <Text style={{ color: Colors.green }}>{wins}W</Text>
        <Text style={{ color: Colors.textMuted }}> / {losses}P</Text>
        <Text style={{ color: Colors.textMuted }}> · {winrate}% winrate</Text>
      </Text>
      {balance !== undefined && (
        <Text style={[styles.balance, { color: getBalanceColor(balance) }]}>
          Bilans: {formatBalance(balance)}
        </Text>
      )}
    </View>
  )
}
