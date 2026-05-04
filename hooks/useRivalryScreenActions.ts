import { useCallback } from 'react'
import { Alert } from 'react-native'
import { AuthService } from '../services/auth.service'
import { BetsService } from '../services/bets.service'
import type { RivalryMatchItem } from '../services/rivalry/rivalry.types'
import type { UserProfile } from '../types/user.types'

type Params = {
  friendId: string
  friendNick: string
  matches: RivalryMatchItem[]
  navigation: { navigate: (...args: any[]) => void }
}

export function useRivalryScreenActions({ friendId, friendNick, matches, navigation }: Params) {
  const openNewBet = useCallback(() => {
    const preselectedFriend: UserProfile = { id: friendId, nick: friendNick, avatarUrl: null }
    navigation.navigate('Tabs', { screen: 'Nowy', params: { preselectedFriend } })
  }, [friendId, friendNick, navigation])

  const handleRematch = useCallback(async () => {
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
  }, [friendId, friendNick, matches, navigation])

  return { openNewBet, handleRematch }
}
