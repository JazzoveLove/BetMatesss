import { Pressable, Text, View } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import { rgbaFromHex, styles } from './styles/RecentMatchCard.styles'

export type RecentDashboardMatch = {
  id: string
  opponentNick: string
  opponentInitials: string
  game: string
  amount: number
  dateLabel: string
  result: 'win' | 'loss'
}

type Props = {
  item: RecentDashboardMatch
  onPress: () => void
}

function formatAmount(amount: number): string {
  const prefix = amount >= 0 ? '+' : ''
  return `${prefix}${amount} j.`
}

export function RecentMatchCard({ item, onPress }: Props) {
  const isWin = item.result === 'win'
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.opponentInitials}</Text>
      </View>
      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>
          {item.game} vs {item.opponentNick}
        </Text>
        <Text style={styles.subtitle}>
          <Text style={[styles.amount, { color: item.amount >= 0 ? Colors.green : Colors.red }]}>
            {formatAmount(item.amount)}
          </Text>{' '}
          | {item.dateLabel}
        </Text>
      </View>
      <View style={[styles.badge, { backgroundColor: isWin ? rgbaFromHex(Colors.green, 0.15) : rgbaFromHex(Colors.red, 0.15) }]}>
        <Text style={[styles.badgeText, { color: isWin ? Colors.green : Colors.red }]}>
          {isWin ? 'Wygrana' : 'Przegrana'}
        </Text>
      </View>
    </Pressable>
  )
}
