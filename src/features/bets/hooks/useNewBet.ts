import { useNavigation, useRoute } from '@react-navigation/native'
import { useBets } from './useBets'
import { useFriends } from '@/features/friends'
import { useNewBetActions } from './useNewBetActions'
import { useNewBetDerived } from './useNewBetDerived'
import type { NewBetNavigation, NewBetRoute, NewBetState } from './useNewBet.types'
import { useNewBetState } from './useNewBetState'

export type { NewBetHandlers, NewBetState, NewBetStep, NewBetNavigation, NewBetRoute } from './useNewBet.types'

export function useNewBet() {
  const navigation = useNavigation<NewBetNavigation>()
  const route = useRoute<NewBetRoute>()
  const preselectedFriend = route.params?.preselectedFriend
  const { friends, nick, avatar } = useFriends()
  const { bets, createBet, loading, error: betsError } = useBets()
  const st = useNewBetState(preselectedFriend)
  const derived = useNewBetDerived(st, friends, nick, avatar, bets)
  const handlers = useNewBetActions(st, derived, navigation, createBet)
  return {
    step: st.step,
    state: {
      currentUser: st.currentUser, selectedGame: st.selectedGame, participants: st.participants, stakeMode: st.stakeMode, stakeAmount: st.stakeAmount, customStakes: st.customStakes, searchQuery: st.searchQuery, searchFocused: st.searchFocused, preselectedFriend: st.preselectedFriend, ...derived, loading, betsError,
    } as NewBetState,
    handlers,
  }
}
