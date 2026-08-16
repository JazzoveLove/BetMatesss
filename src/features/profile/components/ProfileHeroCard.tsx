import { useEffect, useRef } from 'react'
import { Animated, Text, View } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import { styles } from './styles/ProfileHeroCard.styles'

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
  const hasMatches = wins + losses > 0
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
        {hasMatches ? (
          <>
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
          </>
        ) : (
          <View style={styles.heroNeutral} />
        )}
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
