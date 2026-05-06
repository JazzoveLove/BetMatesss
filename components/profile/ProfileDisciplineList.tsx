import { StyleSheet, Text, View } from 'react-native'
import { Colors } from '../../constants/colors'
import type { ProfileDisciplineStat } from '../../types/bet.types'
import { formatBalance, getBalanceColor } from '../../utils/money'

export type ProfileDisciplineListProps = {
  disciplines: Array<{
    gameId: string
    gameName: string
    gameEmoji: string
    wins: number
    losses: number
    total: number
    winRate: number
    balance: number
    hasStake: boolean
  }>
  isBalanceVisible: boolean
}

function getWinRateColor(rate: number): string {
  if (rate >= 60) return Colors.green
  if (rate >= 40) return Colors.amber
  return Colors.red
}

export function ProfileDisciplineList({
  disciplines,
  isBalanceVisible,
}: ProfileDisciplineListProps) {
  if (disciplines.length === 0) return null

  return (
    <>
      <Text style={styles.sectionLabel}>WYNIKI PER DYSCYPLINA</Text>
      {disciplines.map(item => {
        const shownBalance = !isBalanceVisible
          ? '—'
          : !item.hasStake
            ? 'bez stawki'
            : formatBalance(item.balance)
        const balanceColor = !isBalanceVisible
          ? Colors.textMuted
          : !item.hasStake
            ? Colors.textMuted
            : getBalanceColor(item.balance)
        return (
          <View key={item.gameId} style={styles.disciplineCard}>
            <View style={styles.emojiBox}>
              <Text style={styles.emojiText}>{item.gameEmoji}</Text>
            </View>
            <View style={styles.disciplineMiddle}>
              <View style={styles.disciplineTop}>
                <Text style={styles.disciplineName}>{item.gameName}</Text>
                <Text style={[styles.disciplineRate, { color: getWinRateColor(item.winRate) }]}>
                  {item.winRate}%
                </Text>
              </View>
              <View style={styles.disciplineTrack}>
                <View style={[styles.disciplineWin, { flex: item.wins }]} />
                <View style={[styles.disciplineLoss, { flex: item.losses }]} />
              </View>
              <View style={styles.disciplineBottom}>
                <Text style={styles.disciplineMeta}>{item.wins}W {item.losses}P</Text>
                <Text style={[styles.disciplineBalance, { color: balanceColor }]}>
                  {shownBalance}
                </Text>
                <Text style={styles.disciplineMeta}>{item.total} meczów</Text>
              </View>
            </View>
          </View>
        )
      })}
    </>
  )
}

const styles = StyleSheet.create({
  sectionLabel: {
    marginLeft: 16,
    marginTop: 20,
    marginBottom: 12,
    color: Colors.textMuted,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  disciplineCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 16,
    flexDirection: 'row',
  },
  emojiBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 24 },
  disciplineMiddle: { flex: 1, marginLeft: 12 },
  disciplineTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  disciplineName: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  disciplineRate: { fontSize: 15, fontWeight: '700' },
  disciplineTrack: {
    marginTop: 8,
    marginBottom: 8,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: Colors.red,
    flexDirection: 'row',
  },
  disciplineWin: { backgroundColor: Colors.green },
  disciplineLoss: { backgroundColor: Colors.red },
  disciplineBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  disciplineMeta: { color: Colors.textMuted, fontSize: 12 },
  disciplineBalance: { fontSize: 12, fontWeight: '600' },
})
