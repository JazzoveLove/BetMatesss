import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../constants/colors'
import type { UserProfile } from '../types/user.types'
import { calculateOdds } from '../utils/odds'

type OddsPreviewProps = {
  stakes: Record<string, number>
  users: UserProfile[]
}

export default function OddsPreview({ stakes, users }: OddsPreviewProps) {
  const odds = calculateOdds(stakes)
  const total = Object.values(stakes).reduce((sum, value) => sum + value, 0)

  return (
    <View style={styles.container}>
      {users.map(user => {
        const stake = stakes[user.id] ?? 0
        const odd = odds[user.id] ?? 0
        const profit = stake > 0 && odd > 0 ? stake * (odd - 1) : 0
        return (
          <Text key={user.id} style={styles.row}>
            {user.nick} wygra {'->'} +{profit.toFixed(0)} zl
          </Text>
        )
      })}
      <Text style={styles.total}>Pula: {total.toFixed(0)} zl</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    backgroundColor: Colors.cardAlt,
    gap: 4,
  },
  row: {
    color: Colors.text,
    fontSize: 13,
  },
  total: {
    marginTop: 4,
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
})
