import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { Colors } from '../../constants/colors'

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

const styles = StyleSheet.create({
  hero: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 16,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playerCol: { width: 88, alignItems: 'center' },
  scoreCol: { flex: 1, alignItems: 'center' },
  playerAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  playerAvatarText: { color: Colors.white, fontSize: 18, fontWeight: '700' },
  playerName: { marginTop: 8, color: Colors.text, fontSize: 13 },
  playerRate: { marginTop: 4, color: Colors.green, fontSize: 12 },
  bigScore: { color: Colors.text, fontSize: 36, fontWeight: '700' },
  scoreSub: { color: Colors.textMuted, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  heroTrack: {
    marginTop: 12,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.cardAlt,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  heroWin: { height: 6, backgroundColor: Colors.accent },
  heroLoss: { backgroundColor: Colors.cardAlt },
  heroBottom: { marginTop: 16, flexDirection: 'row', alignItems: 'center' },
  metricCol: { flex: 1, alignItems: 'center', gap: 4 },
  metricDivider: { width: 1, height: 32, backgroundColor: Colors.borderSoft },
  metricValue: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  metricLabel: { color: Colors.textMuted, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
})
