/** Stan kreatora nowego zakładu */

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { useAuthContext } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { AuthService } from '../services/auth.service'
import type { GameTemplate } from '../constants/games'
import type { BetFormat, PokerMode, StakeMode } from '../types/bet.types'
import type { UserProfile, UserProfileRow } from '../types/user.types'
import { error } from '../utils/logger'
import type { NewBetStep } from './useNewBet.types'

export type UseNewBetStateReturn = {
  step: NewBetStep
  setStep: Dispatch<SetStateAction<NewBetStep>>
  currentUser: UserProfile | null
  setCurrentUser: Dispatch<SetStateAction<UserProfile | null>>
  selectedGame: GameTemplate | null
  setSelectedGame: Dispatch<SetStateAction<GameTemplate | null>>
  participants: UserProfile[]
  setParticipants: Dispatch<SetStateAction<UserProfile[]>>
  selectedFormat: BetFormat | null
  setSelectedFormat: Dispatch<SetStateAction<BetFormat | null>>
  bestOfCount: 3 | 5 | 7
  setBestOfCount: Dispatch<SetStateAction<3 | 5 | 7>>
  stakeMode: StakeMode
  setStakeMode: Dispatch<SetStateAction<StakeMode>>
  stakeAmount: number
  setStakeAmount: Dispatch<SetStateAction<number>>
  customStakes: Record<string, number>
  setCustomStakes: Dispatch<SetStateAction<Record<string, number>>>
  pokerMode: PokerMode
  setPokerMode: Dispatch<SetStateAction<PokerMode>>
  pokerStack: number
  setPokerStack: Dispatch<SetStateAction<number>>
  pokerRebuyStack: number
  setPokerRebuyStack: Dispatch<SetStateAction<number>>
  stakePerMatch: number
  setStakePerMatch: Dispatch<SetStateAction<number>>
  searchQuery: string
  setSearchQuery: Dispatch<SetStateAction<string>>
  searchFocused: boolean
  setSearchFocused: Dispatch<SetStateAction<boolean>>
  preselectedFriend: UserProfile | undefined
}

export function useNewBetState(preselectedFriend: UserProfile | undefined): UseNewBetStateReturn {
  const { userId } = useAuthContext()
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [step, setStep] = useState<NewBetStep>(1)
  const [selectedGame, setSelectedGame] = useState<GameTemplate | null>(null)
  const [participants, setParticipants] = useState<UserProfile[]>([])
  const [selectedFormat, setSelectedFormat] = useState<BetFormat | null>(null)
  const [bestOfCount, setBestOfCount] = useState<3 | 5 | 7>(3)
  const [stakeMode, setStakeMode] = useState<StakeMode>('equal')
  const [stakeAmount, setStakeAmount] = useState<number>(0)
  const [customStakes, setCustomStakes] = useState<Record<string, number>>({})
  const [pokerMode, setPokerMode] = useState<PokerMode>('winner_takes_all')
  const [pokerStack, setPokerStack] = useState<number>(3000)
  const [pokerRebuyStack, setPokerRebuyStack] = useState<number>(1500)
  const [stakePerMatch, setStakePerMatch] = useState<number>(20)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  useEffect(() => {
    if (!userId) return
    void (async () => {
      try {
        const { data, error: qErr } = await supabase
          .from('users')
          .select('id, nick, avatar_url, invite_code, created_at, phone')
          .eq('id', userId)
          .single()
        if (qErr) throw qErr
        if (data) setCurrentUser(AuthService.mapProfileRow(data as UserProfileRow))
      } catch (e) {
        error('[useNewBet] load current user profile', e)
      }
    })()
  }, [userId])

  useEffect(() => {
    if (!preselectedFriend) return
    setParticipants(prev => (prev.some(p => p.id === preselectedFriend.id) ? prev : [preselectedFriend, ...prev]))
  }, [preselectedFriend])

  return {
    step,
    setStep,
    currentUser,
    setCurrentUser,
    selectedGame,
    setSelectedGame,
    participants,
    setParticipants,
    selectedFormat,
    setSelectedFormat,
    bestOfCount,
    setBestOfCount,
    stakeMode,
    setStakeMode,
    stakeAmount,
    setStakeAmount,
    customStakes,
    setCustomStakes,
    pokerMode,
    setPokerMode,
    pokerStack,
    setPokerStack,
    pokerRebuyStack,
    setPokerRebuyStack,
    stakePerMatch,
    setStakePerMatch,
    searchQuery,
    setSearchQuery,
    searchFocused,
    setSearchFocused,
    preselectedFriend,
  }
}
