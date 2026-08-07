import { useEffect, useRef } from 'react'
import { Animated, Text, View } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import { styles } from './styles/RivalryHeroCard.styles'

export type RivalryHeroCardProps = {
  friendNick: string
  wins: number
  losses: number
  balance: number
  disciplinesCount: number
}

export function RivalryHeroCard({ friendNick, wins, losses, balance, disciplinesCount }: RivalryHeroCardProps) {
  const ratioAnimation = useRef(new Animated.Value(0)).current
  const total = wins + losses
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0
  const friendWinRate = total > 0 ? 100 - winRate : 0
  const friendWins = losses

  useEffect(() => {
    const ratio = total > 0 ? wins / total : 0
    Animated.timing(ratioAnimation, {
      toValue: ratio,
      duration: 500,
      useNativeDriver: false,
    }).start()
  }, [total, wins, ratioAnimation])

  return (
    <View style={styles.hero}>
      <View style={styles.heroTop}>
        <View style={styles.playerCol}>
          <View style={[styles.playerAvatar, { backgroundColor: Colors.accent }]}>
            <Text style={styles.playerAvatarText}>TY</Text>
          </View>
          <Text style={styles.playerName}>Ty</Text>
          <Text style={styles.playerRate}>
            {wins}W · {winRate}%
          </Text>
        </View>
        <View style={styles.scoreCol}>
          <Text style={styles.bigScore}>
            {wins}:{losses}
          </Text>
          <Text style={styles.scoreSub}>{total} MECZY</Text>
        </View>
        <View style={styles.playerCol}>
          <View style={[styles.playerAvatar, { backgroundColor: Colors.cardAlt }]}>
            <Text style={[styles.playerAvatarText, { color: Colors.accentLight }]}>
              {friendNick.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.playerName, { color: Colors.textMuted }]} numberOfLines={1}>
            {friendNick}
          </Text>
          <Text style={[styles.playerRate, { color: Colors.textMuted }]}>
            {friendWins}W · {friendWinRate}%
          </Text>
        </View>
      </View>

      <View style={styles.heroTrack}>
        <Animated.View
          style={[
            styles.heroWin,
            {
              width: ratioAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
        <View
          style={[
            styles.heroLoss,
            { flex: Math.max(0, 1 - (total > 0 ? wins / total : 0)) },
          ]}
        />
      </View>

      <View style={styles.heroBottom}>
        <View style={styles.metricCol}>
          <Text style={[styles.metricValue, { color: balance >= 0 ? Colors.green : Colors.red }]}>
            {balance > 0 ? '+' : ''}
            {balance} zł
          </Text>
          <Text style={styles.metricLabel}>BILANS</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCol}>
          <Text style={styles.metricValue}>{total}</Text>
          <Text style={styles.metricLabel}>MECZE</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCol}>
          <Text style={styles.metricValue}>{disciplinesCount}</Text>
          <Text style={styles.metricLabel}>DYSCYPLINY</Text>
        </View>
      </View>
    </View>
  )
}
