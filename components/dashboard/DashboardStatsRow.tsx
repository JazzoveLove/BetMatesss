import { Animated, StyleSheet, Text, View } from 'react-native'
import { useEffect, useRef } from 'react'
import { Colors } from '../../constants/colors'
import { SkeletonBlock } from './SkeletonBlock'

export type DashboardStats = {
  wins: number
  losses: number
  winRate: number
  totalMatches: number
  balance: number
}

export type DashboardStatsRowProps = {
  stats: DashboardStats
}

function formatCurrency(value: number): string {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${value} zł`
}

export function DashboardStatsRowSkeleton() {
  return (
    <View style={styles.heroCard}>
      <SkeletonBlock width={120} height={44} radius={8} />
      <View style={{ marginTop: 8 }}>
        <SkeletonBlock width={240} height={12} radius={6} />
      </View>
      <View style={{ marginTop: 16 }}>
        <SkeletonBlock width="100%" height={6} radius={3} />
      </View>
      <View style={styles.heroBottom}>
        <SkeletonBlock width={68} height={36} radius={8} />
        <SkeletonBlock width={68} height={36} radius={8} />
        <SkeletonBlock width={68} height={36} radius={8} />
      </View>
    </View>
  )
}

export function DashboardStatsRow({ stats }: DashboardStatsRowProps) {
  const winProgress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(winProgress, {
      toValue: stats.winRate / 100,
      duration: 600,
      useNativeDriver: false,
    }).start()
  }, [stats.winRate, winProgress])

  return (
    <View style={styles.heroCard}>
      <Text style={styles.bigScore}>
        <Text style={{ color: Colors.green }}>{stats.wins}W</Text>
        <Text style={{ color: Colors.textMuted }}> / {stats.losses}P</Text>
      </Text>
      <Text style={styles.heroLabel}>WYGRANE / PRZEGRANE — WSZYSTKIE MECZE</Text>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressWin,
            {
              width: winProgress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
        <View style={[styles.progressLoss, { flex: Math.max(0, 1 - stats.winRate / 100) }]} />
      </View>
      <View style={styles.heroBottom}>
        <View style={styles.metricCol}>
          <Text style={styles.metricValue}>{stats.winRate}%</Text>
          <Text style={styles.metricLabel}>WIN RATE</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCol}>
          <Text style={styles.metricValue}>{stats.totalMatches}</Text>
          <Text style={styles.metricLabel}>MECZE</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCol}>
          <Text style={[styles.metricValue, { color: stats.balance >= 0 ? Colors.green : Colors.red }]}>
            {formatCurrency(stats.balance)}
          </Text>
          <Text style={styles.metricLabel}>BILANS</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  heroCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
  },
  bigScore: { fontSize: 40, fontWeight: '700' },
  heroLabel: {
    marginTop: 4,
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  progressTrack: {
    marginTop: 16,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.red,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  progressWin: { height: 6, backgroundColor: Colors.green },
  progressLoss: { backgroundColor: Colors.red },
  heroBottom: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSoft,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricCol: { flex: 1, alignItems: 'center', gap: 4 },
  metricDivider: { width: 1, height: 32, backgroundColor: Colors.borderSoft },
  metricValue: { color: Colors.text, fontSize: 20, fontWeight: '700' },
  metricLabel: { color: Colors.textMuted, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
})
