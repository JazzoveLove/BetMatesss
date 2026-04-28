import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { DimensionValue } from 'react-native'
import { useEffect, useRef } from 'react'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDashboard } from '../hooks/useDashboard'
import { Colors } from '../constants/colors'
import { ActiveBetCard } from '../components/dashboard/ActiveBetCard'
import { RecentMatchCard } from '../components/dashboard/RecentMatchCard'

function formatCurrency(value: number): string {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${value} zł`
}

function SkeletonBlock({ width, height, radius = 8 }: { width: DimensionValue; height: number; radius?: number }) {
  return <View style={{ width, height, borderRadius: radius, backgroundColor: Colors.cardAlt }} />
}

function SectionHeader({
  title,
  actionText,
  onPress,
}: {
  title: string
  actionText: string
  onPress: () => void
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable onPress={onPress}>
        <Text style={styles.sectionAction}>{actionText}</Text>
      </Pressable>
    </View>
  )
}

export default function DashboardScreen() {
  const navigation = useNavigation<any>()
  const { loading, user, stats, activeBets, recentMatches } = useDashboard()
  const winProgress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(winProgress, {
      toValue: stats.winRate / 100,
      duration: 600,
      useNativeDriver: false,
    }).start()
  }, [stats.winRate, winProgress])

  return (
    <SafeAreaView style={styles.safeTop} edges={['top']}>
      <SafeAreaView style={styles.safeBottom} edges={['bottom']}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 24 }}
          bounces
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.helloMuted}>Cześć,</Text>
              <Text style={styles.nick}>{loading ? '...' : user.nick}</Text>
              <Text style={styles.helloMuted}>{activeBets.length} aktywne zakłady</Text>
            </View>
            <View style={styles.headerRight}>
              <Pressable style={styles.iconButton}>
                <Text style={styles.iconText}>🔔</Text>
              </Pressable>
              <Pressable style={styles.avatarButton} onPress={() => navigation.navigate('Profil')}>
                <Text style={styles.avatarButtonText}>{loading ? '...' : user.avatarInitials}</Text>
              </Pressable>
            </View>
          </View>

          {loading ? (
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
          ) : (
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
          )}

          <View style={styles.section}>
            <SectionHeader
              title="AKTYWNE ZAKŁADY"
              actionText="Zobacz wszystkie ->"
              onPress={() => navigation.navigate('Historia', { initialFilter: 'active' })}
            />
            <View style={styles.cardsColumn}>
              {(loading ? [1, 2, 3] : activeBets.slice(0, 3)).map(item =>
                typeof item === 'number' ? (
                  <View key={item} style={styles.loadingCard}>
                    <SkeletonBlock width={40} height={40} radius={20} />
                    <View style={{ flex: 1, gap: 8 }}>
                      <SkeletonBlock width="76%" height={16} radius={6} />
                      <SkeletonBlock width="56%" height={12} radius={6} />
                    </View>
                    <SkeletonBlock width={72} height={30} radius={8} />
                  </View>
                ) : (
                  <ActiveBetCard
                    key={item.id}
                    item={item}
                    onPress={() => navigation.navigate('BetDetail', { betId: item.id })}
                  />
                ),
              )}
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="OSTATNIE MECZE"
              actionText="Zobacz wszystkie ->"
              onPress={() => navigation.navigate('Historia')}
            />
            <View style={styles.cardsColumn}>
              {(loading ? [1, 2, 3] : recentMatches.slice(0, 3)).map(item =>
                typeof item === 'number' ? (
                  <View key={item} style={styles.loadingCardNoBorder}>
                    <SkeletonBlock width={40} height={40} radius={20} />
                    <View style={{ flex: 1, gap: 8 }}>
                      <SkeletonBlock width="76%" height={16} radius={6} />
                      <SkeletonBlock width="56%" height={12} radius={6} />
                    </View>
                    <SkeletonBlock width={72} height={30} radius={20} />
                  </View>
                ) : (
                  <RecentMatchCard
                    key={item.id}
                    item={item}
                    onPress={() => navigation.navigate('BetDetail', { betId: item.id })}
                  />
                ),
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeTop: { flex: 1, backgroundColor: Colors.background },
  safeBottom: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: { gap: 4 },
  helloMuted: { color: Colors.textMuted, fontSize: 12 },
  nick: { color: Colors.text, fontSize: 28, fontWeight: '700' },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { color: Colors.text, fontSize: 16 },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButtonText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
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
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: Colors.textMuted,
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '700',
  },
  sectionAction: { color: Colors.accentLight, fontSize: 13, fontWeight: '500' },
  cardsColumn: { gap: 12 },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 12,
  },
  loadingCardNoBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
  },
})
