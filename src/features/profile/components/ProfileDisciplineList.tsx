import { Text, View } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import type { ProfileDisciplineStat } from '@/features/bets/types/bet.types'
import { formatBalance, getBalanceColor } from '@/shared/utils/money'
import { getWinRateColor, styles } from './styles/ProfileDisciplineList.styles'

export type ProfileDisciplineListProps = {
  disciplines: {
    gameId: string
    gameName: string
    gameEmoji: string
    wins: number
    losses: number
    total: number
    winRate: number
    balance: number
    hasStake: boolean
  }[]
  isBalanceVisible: boolean
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
