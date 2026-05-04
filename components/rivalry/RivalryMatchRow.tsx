import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors } from '../../constants/colors'
import { GAME_MAP } from '../../constants/games'
import type { RivalryMatchItem } from '../../services/rivalry/rivalry.types'
import { hexToRgba } from '../../utils/colors'

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

const styles = StyleSheet.create({
  matchRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: hexToRgba(Colors.white, 0.06),
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchDay: { width: 36, color: Colors.textMuted, fontSize: 12 },
  matchMiddle: { flex: 1, marginLeft: 8 },
  matchMain: { color: Colors.text, fontSize: 14, fontWeight: '500' },
  matchScore: { marginTop: 2, color: Colors.textMuted, fontSize: 12 },
  matchRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  resultBadgeText: { fontSize: 12, fontWeight: '700' },
  matchAmount: { fontSize: 14, fontWeight: '700' },
})
