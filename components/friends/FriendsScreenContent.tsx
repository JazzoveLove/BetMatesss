import { useMemo, type Dispatch, type SetStateAction } from 'react'
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { EdgeInsets } from 'react-native-safe-area-context'
import type { Friendship } from '../../types/user.types'
import type { UserProfile } from '../../types/user.types'
import { Colors } from '../../constants/colors'
import { hexToRgba } from '../../utils/colors'
import { FriendPendingCard } from './FriendPendingCard'
import { FriendStatCard, friendRowSharedStyles } from './FriendStatCard'
import { FriendsAddModal } from './FriendsAddModal'
import { FriendsSearchBar } from './FriendsSearchBar'

function otherId(row: Friendship, me: string): string {
  return row.userAId === me ? row.userBId : row.userAId
}

export type FriendsScreenContentProps = {
  insets: EdgeInsets
  navigation: { navigate: (...args: unknown[]) => void }
  refreshing: boolean
  onRefresh: () => void
  me: string | null
  friends: Friendship[]
  incoming: Friendship[]
  outgoing: Friendship[]
  nick: (id: string) => string
  accept: (row: Friendship) => void | Promise<void>
  reject: (row: Friendship) => void | Promise<void>
  searchOpen: boolean
  setSearchOpen: Dispatch<SetStateAction<boolean>>
  searchText: string
  setSearchText: (t: string) => void
  addModalOpen: boolean
  setAddModalOpen: Dispatch<SetStateAction<boolean>>
  myInviteCode: string | null
  copyInviteLink: () => void | Promise<void>
  shareInvite: () => void | Promise<void>
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 32 },
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
  sectionLabel: {
    marginLeft: 16,
    marginBottom: 12,
    color: Colors.textMuted,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  listWrap: { paddingHorizontal: 16, gap: 8 },
  playBadge: {
    backgroundColor: hexToRgba(Colors.amber, 0.15),
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  playBadgeText: { color: Colors.amber, fontSize: 12, fontWeight: '700' },
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
})

export function FriendsScreenContent({
  insets,
  navigation,
  refreshing,
  onRefresh,
  me,
  friends,
  incoming,
  outgoing,
  nick,
  accept,
  reject,
  searchOpen,
  setSearchOpen,
  searchText,
  setSearchText,
  addModalOpen,
  setAddModalOpen,
  myInviteCode,
  copyInviteLink,
  shareInvite,
}: FriendsScreenContentProps) {
  const activeFriends = useMemo(() => {
    return friends
      .map(row => {
        const id = me ? otherId(row, me) : ''
        const friendNick = nick(id)
        const words = friendNick.trim().split(/\s+/).filter(Boolean)
        const initials =
          words.length > 1
            ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
            : friendNick.slice(0, 2).toUpperCase()
        return {
          id,
          nick: friendNick,
          initials: initials || '?',
          avatarUrl: undefined as string | undefined,
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
      nick: nick(row.userAId),
      status: 'pending_received' as const,
      row,
    }))
    const outgoingCards = outgoing.map(row => ({
      id: row.id,
      nick: nick(row.userBId),
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

  return (
    <>
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

        <FriendsSearchBar open={searchOpen} value={searchText} onChangeText={setSearchText} />

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
              <Pressable
                key={friend.id}
                style={friendRowSharedStyles.friendCard}
                onPress={() => openNewBetWithFriend(friend)}
              >
                <View style={friendRowSharedStyles.avatarBubble}>
                  <Text style={friendRowSharedStyles.avatarInitials}>{friend.initials}</Text>
                </View>
                <View style={friendRowSharedStyles.friendMiddle}>
                  <View style={friendRowSharedStyles.friendTopRow}>
                    <Text style={friendRowSharedStyles.friendNick}>{friend.nick}</Text>
                    <View style={styles.playBadge}>
                      <Text style={styles.playBadgeText}>Zagraj!</Text>
                    </View>
                  </View>
                  <Text style={friendRowSharedStyles.friendSub}>
                    Brak meczów · {friend.addedLabel}
                  </Text>
                </View>
              </Pressable>
            )
          })}

          {filteredPending.map(item => (
            <FriendPendingCard key={item.id} item={item} onAccept={accept} onReject={reject} />
          ))}

          <Pressable style={styles.addCard} onPress={() => setAddModalOpen(true)}>
            <Text style={styles.addCardText}>+ Dodaj znajomego — link, nick lub QR</Text>
          </Pressable>
        </View>
      </ScrollView>

      <FriendsAddModal
        visible={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onCopyLink={copyInviteLink}
        onShareInvite={shareInvite}
        inviteCode={myInviteCode}
        onOpenNickSearch={() => setSearchOpen(true)}
        onShowQr={() =>
          Alert.alert(
            'QR',
            myInviteCode ? `Twój kod: ${myInviteCode}` : 'Kod QR będzie dostępny po konfiguracji.',
          )
        }
      />
    </>
  )
}
