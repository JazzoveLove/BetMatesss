import { Text, View } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import type { ProfileDisciplineStat } from '@/features/bets/types/bet.types'
import { formatBalance, getBalanceColor } from '@/shared/utils/money'
import { styles } from './styles/StatsSectionCard.styles'

export type StatsSectionCardProps = {
  title: string
  icon: string
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
      <Text style={styles.title}>{icon} {title}</Text>
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
