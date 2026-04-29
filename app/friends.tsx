import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Pressable,
  RefreshControl,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import type { UserProfile } from '../types/user.types'
import { Colors } from '../constants/colors'
import { hexToRgba } from '../utils/colors'
import * as Clipboard from 'expo-clipboard'
import { useFriends } from '../hooks/useFriends'
import type { FriendshipRow } from '../types/user.types'

function otherId(row: FriendshipRow, me: string): string {
  return row.user_a === me ? row.user_b : row.user_a
}

export default function FriendsScreen() {
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const {
    loading, refreshing, me, myInviteCode,
    incoming, outgoing, friends, nick,
    onRefresh, accept, reject,
  } = useFriends()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const searchHeight = useRef(new Animated.Value(0)).current

  async function copyInviteLink() {
    if (!me) return
    const link = `betmates://friends?add=${encodeURIComponent(me)}`
    await Clipboard.setStringAsync(link)
    Alert.alert('Schowek', 'Link skopiowany.')
  }

  async function copyInviteCode() {
    if (!myInviteCode) return
    await Clipboard.setStringAsync(myInviteCode)
    Alert.alert('Schowek', 'Kod skopiowany.')
  }

  async function shareInvite() {
    if (!me) return
    const link = `betmates://friends?add=${encodeURIComponent(me)}`
    const lines = ['Dodaj mnie w BetMates', link]
    if (myInviteCode) lines.push(`Kod: ${myInviteCode}`)
    try {
      await Share.share({ message: lines.join('\n'), title: 'BetMates' })
    } catch {
      Alert.alert('Udostępnianie', 'Nie udało się otworzyć menu udostępniania.')
    }
  }

  useEffect(() => {
    Animated.timing(searchHeight, {
      toValue: searchOpen ? 44 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start()
  }, [searchHeight, searchOpen])

  const activeFriends = useMemo(() => {
    return friends
      .map(row => {
        const id = me ? otherId(row, me) : ''
        const friendNick = nick(id)
        const words = friendNick.trim().split(/\s+/).filter(Boolean)
        const initials = words.length > 1
          ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
          : friendNick.slice(0, 2).toUpperCase()
        return {
          id,
          nick: friendNick,
          initials: initials || '?',
          avatarUrl: undefined,
          totalMatches: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          balance: 0,
          lastActivityLabel: 'brak',
          status: 'new' as const,
          addedLabel: 'dodany niedawno',
        }
      })
      .sort((a, b) => b.totalMatches - a.totalMatches)
  }, [friends, me, nick])

  const pendingCards = useMemo(() => {
    const incomingCards = incoming.map(row => ({
      id: row.id,
      friendId: row.user_a,
      nick: nick(row.user_a),
      status: 'pending_received' as const,
      row,
    }))
    const outgoingCards = outgoing.map(row => ({
      id: row.id,
      friendId: row.user_b,
      nick: nick(row.user_b),
      status: 'pending_sent' as const,
      row,
    }))
    return [...incomingCards, ...outgoingCards]
  }, [incoming, nick, outgoing])

  const filteredActive = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    if (!q) return activeFriends
    return activeFriends.filter(friend => friend.nick.toLowerCase().includes(q))
  }, [activeFriends, searchText])

  const filteredPending = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    if (!q) return pendingCards
    return pendingCards.filter(item => item.nick.toLowerCase().includes(q))
  }, [pendingCards, searchText])

  function openNewBetWithFriend(friend: { id: string; nick: string; avatarUrl?: string }) {
    const preselectedFriend: UserProfile = {
      id: friend.id,
      nick: friend.nick,
      avatarUrl: friend.avatarUrl ?? null,
    }
    navigation.navigate('Tabs', { screen: 'Nowy', params: { preselectedFriend } })
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.accentLight} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        bounces
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accentLight}
            colors={[Colors.accentLight]}
          />
        }
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.headerTitle}>Znajomi</Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.searchBtn} onPress={() => setSearchOpen(prev => !prev)}>
              <Text style={styles.searchBtnText}>🔍</Text>
            </Pressable>
            <Pressable style={styles.plusBtn} onPress={() => setAddModalOpen(true)}>
              <Text style={styles.plusBtnText}>+</Text>
            </Pressable>
          </View>
        </View>

        <Animated.View style={[styles.searchWrap, { height: searchHeight }]}>
          <View style={styles.searchInner}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Szukaj znajomego..."
              placeholderTextColor={Colors.textMuted}
              style={styles.searchInput}
            />
          </View>
        </Animated.View>

        <Text style={styles.sectionLabel}>TWOI RYWALE — POSORTOWANI PO LICZBIE MECZÓW</Text>

        <View style={styles.listWrap}>
          {filteredActive.map(friend => {
            if (friend.totalMatches > 0) {
              return (
                <FriendStatCard
                  key={friend.id}
                  friend={friend}
                  onPress={() => navigation.navigate('Rivalry', { friendId: friend.id })}
                />
              )
            }
            return (
              <Pressable key={friend.id} style={styles.friendCard} onPress={() => openNewBetWithFriend(friend)}>
                <View style={styles.avatarBubble}>
                  <Text style={styles.avatarInitials}>{friend.initials}</Text>
                </View>
                <View style={styles.friendMiddle}>
                  <View style={styles.friendTopRow}>
                    <Text style={styles.friendNick}>{friend.nick}</Text>
                    <View style={styles.playBadge}>
                      <Text style={styles.playBadgeText}>Zagraj!</Text>
                    </View>
                  </View>
                  <Text style={styles.friendSub}>Brak meczów · {friend.addedLabel}</Text>
                </View>
              </Pressable>
            )
          })}

          {filteredPending.map(item => (
            <View key={item.id} style={styles.pendingCard}>
              <View style={styles.pendingTop}>
                <View>
                  <Text style={styles.pendingNick}>{item.nick}</Text>
                  <Text style={styles.pendingSub}>Zaproszenie oczekuje</Text>
                </View>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>Oczekuje</Text>
                </View>
              </View>
              {item.status === 'pending_received' && (
                <View style={styles.pendingActions}>
                  <Pressable style={styles.acceptBtn} onPress={() => void accept(item.row)}>
                    <Text style={styles.acceptText}>Akceptuj</Text>
                  </Pressable>
                  <Pressable style={styles.rejectBtn} onPress={() => void reject(item.row)}>
                    <Text style={styles.rejectText}>Odrzuć</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))}

          <Pressable style={styles.addCard} onPress={() => setAddModalOpen(true)}>
            <Text style={styles.addCardText}>+ Dodaj znajomego — link, nick lub QR</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={addModalOpen} transparent animationType="fade" onRequestClose={() => setAddModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Dodaj znajomego</Text>
            <Pressable
              style={styles.modalOption}
              onPress={() => {
                void copyInviteLink()
                setAddModalOpen(false)
              }}
            >
              <Text style={styles.modalOptionText}>Kopiuj link</Text>
            </Pressable>
            <Pressable
              style={styles.modalOption}
              onPress={() => {
                setAddModalOpen(false)
                setSearchOpen(true)
              }}
            >
              <Text style={styles.modalOptionText}>Wpisz nick</Text>
            </Pressable>
            <Pressable
              style={styles.modalOption}
              onPress={() => {
                setAddModalOpen(false)
                Alert.alert('QR', myInviteCode ? `Twój kod: ${myInviteCode}` : 'Kod QR będzie dostępny po konfiguracji.')
              }}
            >
              <Text style={styles.modalOptionText}>Pokaż QR</Text>
            </Pressable>
            <Pressable style={styles.modalClose} onPress={() => setAddModalOpen(false)}>
              <Text style={styles.modalCloseText}>Zamknij</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

function FriendStatCard({
  friend,
  onPress,
}: {
  friend: {
    id: string
    nick: string
    initials: string
    totalMatches: number
    wins: number
    losses: number
    winRate: number
    balance: number
    lastActivityLabel: string
  }
  onPress: () => void
}) {
  const progress = useRef(new Animated.Value(0)).current
  const ratio = friend.totalMatches > 0 ? friend.wins / friend.totalMatches : 0

  useEffect(() => {
    Animated.timing(progress, {
      toValue: ratio,
      duration: 500,
      useNativeDriver: false,
    }).start()
  }, [progress, ratio])

  const winRateColor = friend.winRate >= 60 ? Colors.green : friend.winRate >= 40 ? Colors.amber : Colors.red
  const balanceColor = friend.balance > 0 ? Colors.green : friend.balance < 0 ? Colors.red : Colors.textMuted
  const balanceLabel = friend.balance > 0 ? `+${friend.balance} zł` : `${friend.balance} zł`

  return (
    <Pressable style={styles.friendCard} onPress={onPress}>
      <View style={styles.avatarBubble}>
        <Text style={styles.avatarInitials}>{friend.initials}</Text>
      </View>
      <View style={styles.friendMiddle}>
        <View style={styles.friendTopRow}>
          <Text style={styles.friendNick}>{friend.nick}</Text>
          <Text style={[styles.winRate, { color: winRateColor }]}>{friend.winRate}%</Text>
        </View>
        <Text style={styles.friendSub}>{friend.totalMatches} meczów razem · ostatni: {friend.lastActivityLabel}</Text>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressWin,
              {
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
          <View style={[styles.progressLoss, { flex: Math.max(0, 1 - ratio) }]} />
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.metaText}>{friend.wins}W {friend.losses}P</Text>
          <Text style={[styles.balanceText, { color: balanceColor }]}>{balanceLabel}</Text>
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 32 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: Colors.text, fontSize: 20, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 8 },
  searchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: { color: Colors.textMuted, fontSize: 14 },
  plusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBtnText: { color: Colors.white, fontSize: 20, lineHeight: 24, fontWeight: '700' },
  searchWrap: { overflow: 'hidden', marginHorizontal: 16, marginTop: 8, marginBottom: 8 },
  searchInner: {
    height: 44,
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchIcon: { color: Colors.textMuted, fontSize: 14 },
  searchInput: { flex: 1, color: Colors.text, fontSize: 14, paddingVertical: 0 },
  sectionLabel: {
    marginLeft: 16,
    marginBottom: 12,
    color: Colors.textMuted,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  listWrap: { paddingHorizontal: 16, gap: 8 },
  friendCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { color: Colors.accentLight, fontSize: 16, fontWeight: '700' },
  friendMiddle: { flex: 1, marginLeft: 12 },
  friendTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  friendNick: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  winRate: { fontSize: 15, fontWeight: '700' },
  friendSub: { marginTop: 4, color: Colors.textMuted, fontSize: 12 },
  progressTrack: {
    marginTop: 8,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: Colors.cardAlt,
    flexDirection: 'row',
  },
  progressWin: { height: 4, backgroundColor: Colors.green },
  progressLoss: { backgroundColor: Colors.cardAlt },
  statsRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaText: { color: Colors.textMuted, fontSize: 11 },
  balanceText: { fontSize: 13, fontWeight: '700' },
  playBadge: {
    backgroundColor: hexToRgba(Colors.amber, 0.15),
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  playBadgeText: { color: Colors.amber, fontSize: 12, fontWeight: '700' },
  pendingCard: {
    opacity: 0.7,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: hexToRgba(Colors.white, 0.15),
    borderStyle: 'dashed',
    padding: 16,
  },
  pendingTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pendingNick: { color: Colors.textMuted, fontSize: 15 },
  pendingSub: { marginTop: 4, color: Colors.textMuted, fontSize: 12 },
  pendingBadge: { backgroundColor: Colors.cardAlt, borderRadius: 20, paddingVertical: 4, paddingHorizontal: 12 },
  pendingBadgeText: { color: Colors.textMuted, fontSize: 12 },
  pendingActions: { marginTop: 12, flexDirection: 'row', gap: 8 },
  acceptBtn: { borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: hexToRgba(Colors.green, 0.15) },
  acceptText: { color: Colors.green, fontSize: 13, fontWeight: '700' },
  rejectBtn: { borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: hexToRgba(Colors.red, 0.15) },
  rejectText: { color: Colors.red, fontSize: 13, fontWeight: '700' },
  addCard: {
    marginTop: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: hexToRgba(Colors.white, 0.2),
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCardText: { color: Colors.accentLight, fontSize: 14, fontWeight: '500' },
  modalOverlay: {
    flex: 1,
    backgroundColor: hexToRgba(Colors.background, 0.7),
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 16,
  },
  modalTitle: { color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  modalOption: {
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  modalOptionText: { color: Colors.text, fontSize: 14, fontWeight: '500' },
  modalClose: {
    marginTop: 4,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.accent,
  },
  modalCloseText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
})
