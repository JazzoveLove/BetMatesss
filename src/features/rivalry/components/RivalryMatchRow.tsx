import { Pressable, Text, View } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import { GAME_MAP } from '@/shared/constants/games'
import type { RivalryMatchItem } from '@/features/rivalry/api/rivalry.types'
import { hexToRgba } from '@/shared/utils/colors'
import { styles } from './styles/RivalryMatchRow.styles'

export type RivalryMatchRowProps = {
  match: RivalryMatchItem
  onPress: () => void
}

function dayLabel(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  if (sameDay) return 'dziś'
  const short = ['ndz.', 'pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.']
  return short[date.getDay()] ?? '—'
}

export function RivalryMatchRow({ match, onPress }: RivalryMatchRowProps) {
  const game = GAME_MAP[match.gameTemplate] ?? { emoji: '🎲', label: match.gameTemplate }
  const win = match.outcome === 'win'
  const resultLabel = win ? 'W' : 'P'
  const amountLabel = match.stakeAmount > 0 ? `${match.profit > 0 ? '+' : ''}${match.profit}` : ''
  const amountColor = win ? Colors.green : Colors.red

  return (
    <Pressable style={styles.matchRow} onPress={onPress}>
      <Text style={styles.matchDay}>{dayLabel(match.createdAt)}</Text>
      <View style={styles.matchMiddle}>
        <Text style={styles.matchMain}>
          {game.emoji} {game.label}
        </Text>
        <Text style={styles.matchScore}>{match.score ?? ''}</Text>
      </View>
      <View style={styles.matchRight}>
        <View
          style={[
            styles.resultBadge,
            { backgroundColor: win ? hexToRgba(Colors.green, 0.15) : hexToRgba(Colors.red, 0.15) },
          ]}
        >
          <Text style={[styles.resultBadgeText, { color: amountColor }]}>{resultLabel}</Text>
        </View>
        {amountLabel ? <Text style={[styles.matchAmount, { color: amountColor }]}>{amountLabel}</Text> : null}
      </View>
    </Pressable>
  )
}
