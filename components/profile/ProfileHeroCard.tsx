import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import { Colors } from '../../constants/colors'

export type ProfileHeroCardProps = {
  wins: number
  losses: number
  disciplines: number
  friends: number
  currentStreak: number
}

export function ProfileHeroCard({
  wins,
  losses,
  disciplines,
  friends,
  currentStreak,
}: ProfileHeroCardProps) {
  const winProgress = useRef(new Animated.Value(0)).current
  const totalWL = Math.max(1, wins + losses)
  const winRatio = wins / totalWL

  useEffect(() => {
    Animated.timing(winProgress, {
      toValue: winRatio,
      duration: 600,
      useNativeDriver: false,
    }).start()
  }, [winProgress, winRatio])

  return (
    <View style={styles.heroCard}>
      <Text style={styles.heroScore}>
        <Text style={{ color: Colors.green }}>{wins}W</Text>
        <Text style={{ color: Colors.textMuted }}> / {losses}P</Text>
      </Text>
      <Text style={styles.heroLabel}>WSZYSTKIE MECZE ŁĄCZNIE</Text>
      <View style={styles.heroTrack}>
        <Animated.View
          style={[
            styles.heroWin,
            {
              width: winProgress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
        <View style={[styles.heroLoss, { flex: Math.max(0, 1 - winRatio) }]} />
      </View>
      <View style={styles.heroBottom}>
        <View style={styles.heroMetric}>
          <Text style={styles.heroMetricValue}>{disciplines}</Text>
          <Text style={styles.heroMetricLabel}>DYSCYPLINY</Text>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroMetric}>
          <Text style={styles.heroMetricValue}>{friends}</Text>
          <Text style={styles.heroMetricLabel}>ZNAJOMI</Text>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroMetric}>
          <Text style={styles.heroMetricValue}>
            {currentStreak > 0 ? currentStreak : '—'}
          </Text>
          <Text style={styles.heroMetricLabel}>SERIA W.</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  heroCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 16,
  },
  heroScore: { color: Colors.text, fontSize: 36, fontWeight: '700' },
  heroLabel: { marginTop: 4, color: Colors.textMuted, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  heroTrack: {
    marginTop: 12,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.red,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  heroWin: { height: 5, backgroundColor: Colors.green },
  heroLoss: { backgroundColor: Colors.red },
  heroBottom: { marginTop: 16, flexDirection: 'row', alignItems: 'center' },
  heroMetric: { flex: 1, alignItems: 'center', gap: 4 },
  heroDivider: { width: 1, height: 36, backgroundColor: Colors.borderSoft },
  heroMetricValue: { color: Colors.text, fontSize: 20, fontWeight: '700' },
  heroMetricLabel: { color: Colors.textMuted, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
})
