import type { Dispatch, SetStateAction } from 'react'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { RouteProp } from '@react-navigation/native'
import type { GameTemplate } from '../constants/games'
import type { BetFormat, PokerMode, StakeMode } from '../types/bet.types'
import type { UserProfile } from '../types/user.types'
import type { TabParamList } from '../navigation/types'

export type NewBetNavigation = BottomTabNavigationProp<TabParamList, 'Nowy'>
export type NewBetRoute = RouteProp<TabParamList, 'Nowy'>

export type NewBetStep = 1 | 2 | 3

export type NewBetState = {
  currentUser: UserProfile | null
  selectedGame: GameTemplate | null
  participants: UserProfile[]
  selectedFormat: BetFormat | null
  bestOfCount: 3 | 5 | 7
  stakeMode: StakeMode
  stakeAmount: number
  customStakes: Record<string, number>
  pokerMode: PokerMode
  pokerStack: number
  pokerRebuyStack: number
  stakePerMatch: number
  searchQuery: string
  searchFocused: boolean
  preselectedFriend: UserProfile | undefined
  availableFormats: BetFormat[]
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
  resetNewBet: () => void
  toggleParticipant: (friend: UserProfile) => void
  setParticipants: Dispatch<SetStateAction<UserProfile[]>>
  setStep: Dispatch<SetStateAction<NewBetStep>>
  setSelectedFormat: Dispatch<SetStateAction<BetFormat | null>>
  setBestOfCount: Dispatch<SetStateAction<3 | 5 | 7>>
  setStakePerMatch: Dispatch<SetStateAction<number>>
  setPokerMode: Dispatch<SetStateAction<PokerMode>>
  setPokerStack: Dispatch<SetStateAction<number>>
  setPokerRebuyStack: Dispatch<SetStateAction<number>>
  setStakeMode: Dispatch<SetStateAction<StakeMode>>
  setStakeAmount: Dispatch<SetStateAction<number>>
  setCustomStakes: Dispatch<SetStateAction<Record<string, number>>>
  setSearchQuery: Dispatch<SetStateAction<string>>
  setSearchFocused: (v: boolean) => void
}
