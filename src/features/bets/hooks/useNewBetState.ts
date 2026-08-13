
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { useAuthContext } from '@/features/auth'
import { UsersService } from '@/shared/lib/users.service'
import type { GameTemplate } from '@/shared/constants/games'
import type { StakeMode } from '@/features/bets/types/bet.types'
import type { UserProfile } from '@/shared/types/user.types'
import { error } from '@/shared/utils/logger'
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
  stakeMode: StakeMode
  setStakeMode: Dispatch<SetStateAction<StakeMode>>
  stakeAmount: number
  setStakeAmount: Dispatch<SetStateAction<number>>
  customStakes: Record<string, number>
  setCustomStakes: Dispatch<SetStateAction<Record<string, number>>>
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
  const [stakeMode, setStakeMode] = useState<StakeMode>('equal')
  const [stakeAmount, setStakeAmount] = useState<number>(0)
  const [customStakes, setCustomStakes] = useState<Record<string, number>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  useEffect(() => {
    if (!userId) return
    void (async () => {
      try {
        const profile = await UsersService.getFullProfile(userId)
        if (profile) setCurrentUser(profile)
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
    stakeMode,
    setStakeMode,
    stakeAmount,
    setStakeAmount,
    customStakes,
    setCustomStakes,
    searchQuery,
    setSearchQuery,
    searchFocused,
    setSearchFocused,
    preselectedFriend,
  }
}
