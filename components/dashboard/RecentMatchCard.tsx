import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors } from '../../constants/colors'

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

function rgbaFromHex(hexColor: string, alpha: number): string {
  const parsed = hexColor.replace('#', '')
  const num = Number.parseInt(parsed, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r},${g},${b},${alpha})`
}

function formatAmount(amount: number): string {
  const prefix = amount >= 0 ? '+' : ''
  return `${prefix}${amount} zł`
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  center: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  amount: {
    fontWeight: '700',
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
})
