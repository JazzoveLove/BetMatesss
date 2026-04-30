import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRivalry } from '../hooks/useRivalry'
import { Colors } from '../constants/colors'
import { GAME_MAP } from '../constants/games'
import { BetsService } from '../services/bets.service'
import { AuthService } from '../services/auth.service'
import type { UserProfile } from '../types/user.types'
import { hexToRgba } from '../utils/colors'

type RivalryRouteParams = {
  friendId: string
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

export default function RivalryScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute()
  const insets = useSafeAreaInsets()
  const { friendId } = (route.params ?? {}) as RivalryRouteParams
  const {
    loading,
    refreshing,
    matches,
    friendNick,
    onRefresh,
  } = useRivalry(friendId)
  const [activeGameId, setActiveGameId] = useState<string | null>(null)
  const ratioAnimation = useRef(new Animated.Value(0)).current

  const chips = useMemo(() => {
    return [...new Set(matches.map(item => item.gameTemplate))]
  }, [matches])

  const filteredMatches = useMemo(() => {
    if (!activeGameId) return matches
    return matches.filter(item => item.gameTemplate === activeGameId)
  }, [activeGameId, matches])

  const heroStats = useMemo(() => {
    const wins = filteredMatches.filter(item => item.outcome === 'win').length
    const losses = filteredMatches.filter(item => item.outcome === 'loss').length
    const total = wins + losses
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0
    const friendWinRate = total > 0 ? 100 - winRate : 0
    const balance = filteredMatches.reduce((sum, item) => sum + item.profit, 0)
    const disciplines = new Set(filteredMatches.map(item => item.gameTemplate)).size
    return {
      wins,
      losses,
      total,
      winRate,
      friendWins: losses,
      friendWinRate,
      balance,
      disciplines,
    }
  }, [filteredMatches])

  useEffect(() => {
    const ratio = heroStats.total > 0 ? heroStats.wins / heroStats.total : 0
    Animated.timing(ratioAnimation, {
      toValue: ratio,
      duration: 500,
      useNativeDriver: false,
    }).start()
  }, [heroStats.total, heroStats.wins, ratioAnimation])

  function openNewBet() {
    const preselectedFriend: UserProfile = { id: friendId, nick: friendNick, avatarUrl: null }
    navigation.navigate('Tabs', { screen: 'Nowy', params: { preselectedFriend } })
  }

  async function handleRematch() {
    const latest = matches[0]
    if (!latest) {
      Alert.alert('Brak danych', 'Nie ma jeszcze meczu do rewanżu.')
      return
    }
    const me = await AuthService.getCurrentUserProfile()
    if (!me) return
    const detail = await BetsService.getBetDetail(latest.betId)
    if (!detail) {
      Alert.alert('Błąd', 'Nie udało się pobrać ostatniego meczu.')
      return
    }
    const meStake = detail.participants.find(p => p.id === me.id)?.stakeAmount ?? 0
    const friendStake = detail.participants.find(p => p.id === friendId)?.stakeAmount ?? meStake
    await BetsService.createBet({
      creatorId: me.id,
      gameTemplate: detail.gameTemplate,
      format: detail.format,
      stakeMode: detail.stakeMode,
      participants: [
        { id: me.id, nick: me.nick, customStake: meStake },
        { id: friendId, nick: friendNick, customStake: friendStake },
      ],
      globalStake: meStake,
      stakeAmount: meStake,
      participantIds: [friendId],
      bestOfCount: (detail as any).bestOfCount ?? undefined,
      stakePerMatch: (detail as any).stakePerMatch ?? undefined,
    })
    Alert.alert('Gotowe', 'Rewanż został utworzony.')
    navigation.navigate('Tabs', { screen: 'Home' })
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.loading}>
        <ActivityIndicator color={Colors.accentLight} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.iconBtnText}>{'<'}</Text>
        </Pressable>
        <Text style={styles.headerNick} numberOfLines={1}>{friendNick}</Text>
        <Pressable
          style={styles.iconBtn}
          onPress={() =>
            Alert.alert('Opcje', undefined, [
              { text: 'Usuń znajomego' },
              { text: 'Zablokuj' },
              { text: 'Anuluj', style: 'cancel' },
            ])
          }
        >
          <Text style={styles.iconBtnText}>···</Text>
        </Pressable>
      </View>

      <FlatList
        data={filteredMatches}
        keyExtractor={item => item.betId}
        style={styles.list}
        bounces
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accentLight}
            colors={[Colors.accentLight]}
          />
        }
        ListHeaderComponent={
          <>
            <View style={styles.hero}>
              <View style={styles.heroTop}>
                <View style={styles.playerCol}>
                  <View style={[styles.playerAvatar, { backgroundColor: Colors.accent }]}>
                    <Text style={styles.playerAvatarText}>TY</Text>
                  </View>
                  <Text style={styles.playerName}>Ty</Text>
                  <Text style={styles.playerRate}>{heroStats.wins}W · {heroStats.winRate}%</Text>
                </View>
                <View style={styles.scoreCol}>
                  <Text style={styles.bigScore}>{heroStats.wins}:{heroStats.losses}</Text>
                  <Text style={styles.scoreSub}>{heroStats.total} MECZY</Text>
                </View>
                <View style={styles.playerCol}>
                  <View style={[styles.playerAvatar, { backgroundColor: Colors.cardAlt }]}>
                    <Text style={[styles.playerAvatarText, { color: Colors.accentLight }]}>
                      {friendNick.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.playerName, { color: Colors.textMuted }]} numberOfLines={1}>{friendNick}</Text>
                  <Text style={[styles.playerRate, { color: Colors.textMuted }]}>
                    {heroStats.friendWins}W · {heroStats.friendWinRate}%
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
                <View style={[styles.heroLoss, { flex: Math.max(0, 1 - (heroStats.total > 0 ? heroStats.wins / heroStats.total : 0)) }]} />
              </View>

              <View style={styles.heroBottom}>
                <View style={styles.metricCol}>
                  <Text style={[styles.metricValue, { color: heroStats.balance >= 0 ? Colors.green : Colors.red }]}>
                    {heroStats.balance > 0 ? '+' : ''}
                    {heroStats.balance} zł
                  </Text>
                  <Text style={styles.metricLabel}>BILANS</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricCol}>
                  <Text style={styles.metricValue}>{heroStats.total}</Text>
                  <Text style={styles.metricLabel}>MECZE</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricCol}>
                  <Text style={styles.metricValue}>{heroStats.disciplines}</Text>
                  <Text style={styles.metricLabel}>DYSCYPLINY</Text>
                </View>
              </View>
            </View>

            <View style={styles.chipsRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipsInner}>
                  <Pressable
                    style={[styles.chip, !activeGameId && styles.chipActive]}
                    onPress={() => setActiveGameId(null)}
                  >
                    <Text style={[styles.chipText, !activeGameId && styles.chipTextActive]}>Wszystkie</Text>
                  </Pressable>
                  {chips.map(gameId => {
                    const active = gameId === activeGameId
                    return (
                      <Pressable
                        key={gameId}
                        style={[styles.chip, active && styles.chipSoftActive]}
                        onPress={() => setActiveGameId(gameId)}
                      >
                        <Text style={[styles.chipText, active && styles.chipSoftTextActive]}>
                          {GAME_MAP[gameId]?.emoji ?? '🎲'} {GAME_MAP[gameId]?.label ?? gameId}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </ScrollView>
            </View>

            <Text style={styles.sectionLabel}>OSTATNIE MECZE</Text>
          </>
        }
        renderItem={({ item }) => {
          const game = GAME_MAP[item.gameTemplate] ?? { emoji: '🎲', label: item.gameTemplate }
          const win = item.outcome === 'win'
          const resultLabel = win ? 'W' : 'P'
          const amountLabel = item.stakeAmount > 0 ? `${item.profit > 0 ? '+' : ''}${item.profit}` : ''
          const amountColor = win ? Colors.green : Colors.red
          return (
            <View style={styles.matchRow}>
              <Text style={styles.matchDay}>{dayLabel(item.createdAt)}</Text>
              <View style={styles.matchMiddle}>
                <Text style={styles.matchMain}>{game.emoji} {game.label}</Text>
                <Text style={styles.matchScore}>{item.score ?? ''}</Text>
              </View>
              <View style={styles.matchRight}>
                <View style={[styles.resultBadge, { backgroundColor: win ? hexToRgba(Colors.green, 0.15) : hexToRgba(Colors.red, 0.15) }]}>
                  <Text style={[styles.resultBadgeText, { color: amountColor }]}>{resultLabel}</Text>
                </View>
                {amountLabel ? <Text style={[styles.matchAmount, { color: amountColor }]}>{amountLabel}</Text> : null}
              </View>
            </View>
          )
        }}
        ListEmptyComponent={
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>Brak meczów dla tego filtra.</Text>
          </View>
        }
      />

      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={styles.newBetBtn} onPress={openNewBet}>
          <Text style={styles.newBetText}>+ Nowy zakład</Text>
        </Pressable>
        <Pressable style={styles.rematchBtn} onPress={() => void handleRematch()}>
          <Text style={styles.rematchText}>🔄 Rewanż</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1, backgroundColor: Colors.background },
  listContent: { paddingBottom: 100 },
  header: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  headerNick: { flex: 1, textAlign: 'center', color: Colors.text, fontSize: 17, fontWeight: '700', marginHorizontal: 12 },
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
  chipsRow: { marginTop: 12, paddingHorizontal: 16 },
  chipsInner: { flexDirection: 'row', alignItems: 'center' },
  chip: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  chipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipSoftActive: { backgroundColor: hexToRgba(Colors.accent, 0.2), borderColor: Colors.accent },
  chipText: { color: Colors.textMuted, fontSize: 13 },
  chipTextActive: { color: Colors.white, fontWeight: '700' },
  chipSoftTextActive: { color: Colors.accentLight, fontWeight: '700' },
  sectionLabel: {
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 8,
    color: Colors.textMuted,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
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
  emptyRow: { paddingHorizontal: 16, paddingVertical: 12 },
  emptyText: { color: Colors.textMuted, fontSize: 13 },
  bottomActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: 'row',
    gap: 8,
  },
  newBetBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBetText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  rematchBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rematchText: { color: Colors.text, fontSize: 15, fontWeight: '700' },
})
