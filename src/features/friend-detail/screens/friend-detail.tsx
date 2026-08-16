import { useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from '@/shared/constants/colors'
import { GAME_MAP } from '@/shared/constants/games'
import { formatBalance, getBalanceColor } from '@/shared/utils/money'
import { useFriendDetail } from '@/features/friend-detail/hooks/useFriendDetail'
import type { RootStackParamList } from '@/navigation/types'
import type { UserProfile } from '@/shared/types/user.types'
import { styles } from './styles/friend-detail.styles'
import { HistoryFilterBar } from '@/features/bets/components/history/HistoryFilterBar'
import { HistoryListItem } from '@/features/bets/components/history/HistoryListItem'
import { useFriendHistory } from '@/features/friend-detail/hooks/useFriendHistory'
import { SettleModal } from '@/features/friend-detail/components/SettleModal'
import { useSettlePayment } from '@/features/friend-detail/hooks/useSettlePayment'

type FriendDetailRouteProp = RouteProp<RootStackParamList, 'FriendDetail'>
type Nav = NativeStackNavigationProp<RootStackParamList>

export default function FriendDetailScreen() {
  const navigation = useNavigation<Nav>()
  const route = useRoute<FriendDetailRouteProp>()
  const { friendId } = route.params
  const { loading, refreshing, friendNick, balance, stats, refresh } = useFriendDetail(friendId)
  const { items: historyItems, filter, setFilter } = useFriendHistory(friendId)
  const [settleOpen, setSettleOpen] = useState(false)
  const { settling, settle } = useSettlePayment(friendId, async () => {
    await refresh()
  })

  function openNewBetWithFriend() {
    const preselectedFriend: UserProfile = {
      id: friendId,
      nick: friendNick,
      avatarUrl: null,
    }
    navigation.navigate('Tabs', {
      screen: 'Nowy',
      params: { preselectedFriend },
    })
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
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.accentLight} colors={[Colors.accentLight]} />
        }
      >
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={styles.backBtnText}>{'<'}</Text>
          </Pressable>
          <Text style={styles.title}>{friendNick}</Text>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>SALDO</Text>
          <Text style={[styles.balanceValue, { color: getBalanceColor(balance) }]}>
            {formatBalance(balance)}
          </Text>
        </View>

        <Pressable style={styles.playCta} onPress={openNewBetWithFriend}>
          <Text style={styles.playCtaText}>Zagraj ze znajomym</Text>
        </Pressable>

        {balance !== 0 && (
          <Pressable style={styles.settleCta} onPress={() => setSettleOpen(true)}>
            <Text style={styles.settleCtaText}>Rozlicz</Text>
          </Pressable>
        )}

        <Text style={styles.sectionLabel}>STATYSTYKI WEDŁUG DYSCYPLINY</Text>
        {stats.length === 0 ? (
          <Text style={styles.emptyText}>Brak wspólnych, potwierdzonych zakładów.</Text>
        ) : (
          stats.map(stat => {
            const total = stat.wins + stat.losses
            const winRate = total > 0 ? Math.round((stat.wins / total) * 100) : 0
            const game = GAME_MAP[stat.gameTemplate] ?? { emoji: '🎲', label: stat.gameTemplate }
            return (
              <View key={stat.gameTemplate} style={styles.statRow}>
                <Text style={styles.statGame}>{game.emoji} {game.label}</Text>
                <Text style={styles.statScore}>{stat.wins}W {stat.losses}P · {winRate}%</Text>
              </View>
            )
          })
          
        )}<Text style={styles.sectionLabel}>HISTORIA WSPÓLNYCH ZAKŁADÓW</Text>
        <HistoryFilterBar filter={filter} onFilterChange={setFilter} />
        {historyItems.length === 0 ? (
          <Text style={styles.emptyText}>Brak zakładów pasujących do filtra.</Text>
        ) : (
          historyItems.map(item => (
            <HistoryListItem
              key={item.id}
              item={item}
              onPress={betId => navigation.navigate('BetDetail', { betId })}
            />
          ))
        )}
      </ScrollView>

      <SettleModal
        visible={settleOpen}
        onClose={() => setSettleOpen(false)}
        friendNick={friendNick}
        balance={balance}
        settling={settling}
        onConfirm={amount => settle(amount, balance)}
      />
    </SafeAreaView>
  )
}