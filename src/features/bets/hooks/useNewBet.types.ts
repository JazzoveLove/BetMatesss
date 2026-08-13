import type { Dispatch, SetStateAction } from 'react'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { RouteProp } from '@react-navigation/native'
import type { GameTemplate } from '@/shared/constants/games'
import type { StakeMode } from '@/features/bets/types/bet.types'
import type { UserProfile } from '@/shared/types/user.types'

export type NewBetTabParamList = {
  Home: undefined
  Historia: undefined
  Nowy: { preselectedFriend?: UserProfile } | undefined
  Znajomi: undefined
  Profil: undefined
}

export type NewBetNavigation = BottomTabNavigationProp<NewBetTabParamList, 'Nowy'>
export type NewBetRoute = RouteProp<NewBetTabParamList, 'Nowy'>

export type NewBetStep = 1 | 2

export type NewBetState = {
  currentUser: UserProfile | null
  selectedGame: GameTemplate | null
  participants: UserProfile[]
  stakeMode: StakeMode
  stakeAmount: number
  customStakes: Record<string, number>
  searchQuery: string
  searchFocused: boolean
  preselectedFriend: UserProfile | undefined
  friendProfiles: UserProfile[]
  recentGames: GameTemplate[]
  gamesFiltered: GameTemplate[]
  totalPlayers: number
  sectionData: { title: string; data: GameTemplate[]; show: boolean }[]
  loading: boolean
  betsError: string | null
}

export type NewBetHandlers = {
  handleGameSelect: (game: GameTemplate) => void
  handleBack: () => void
  handleSubmit: () => Promise<void>
  isSubmitting: boolean
  resetNewBet: () => void
  toggleParticipant: (friend: UserProfile) => void
  setParticipants: Dispatch<SetStateAction<UserProfile[]>>
  setStep: Dispatch<SetStateAction<NewBetStep>>
  setStakeMode: Dispatch<SetStateAction<StakeMode>>
  setStakeAmount: Dispatch<SetStateAction<number>>
  setCustomStakes: Dispatch<SetStateAction<Record<string, number>>>
  setSearchQuery: Dispatch<SetStateAction<string>>
  setSearchFocused: (v: boolean) => void
}
