import { StyleSheet, Text, View } from 'react-native'
import { Colors } from '../../constants/colors'
import type { ProfileDisciplineStat } from '../../types/bet.types'
import { formatBalance, getBalanceColor } from '../../utils/money'

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

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 14,
    gap: 4,
  },
  title: { color: Colors.text, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  row: { fontSize: 14 },
  balance: { fontSize: 13, fontWeight: '600' },
})
