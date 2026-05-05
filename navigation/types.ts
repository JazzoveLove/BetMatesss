import type { NavigatorScreenParams } from '@react-navigation/native'
import type { UserProfile } from '../types/user.types'

export type TabParamList = {
  Home: undefined
  Historia: { initialFilter?: 'active' | 'all' } | undefined
  Nowy: { preselectedFriend?: UserProfile } | undefined
  Znajomi: undefined
  Profil: undefined
}

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined
  BetDetail: { betId: string }
  JoinBet: { code: string }
  Rivalry: { friendId: string }
}
