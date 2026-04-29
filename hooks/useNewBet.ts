import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { Alert } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { AuthService } from '../services/auth.service'
import { GAME_TEMPLATES, type GameTemplate } from '../constants/games'
import type { BetFormat, PokerMode, StakeMode } from '../types/bet.types'
import type { UserProfile } from '../types/user.types'
import { useBets } from './useBets'
import { useFriends } from './useFriends'
import { getAvailableFormats, getDefaultFormat } from '../utils/formats'
import { log } from '../utils/logger'

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

export function useNewBet() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const preselectedFriend = route.params?.preselectedFriend as UserProfile | undefined
  const { friends, nick, avatar } = useFriends()
  const { bets, createBet, loading } = useBets()

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [step, setStep] = useState<NewBetStep>(1)
  const [selectedGame, setSelectedGame] = useState<GameTemplate | null>(null)
  const [participants, setParticipants] = useState<UserProfile[]>([])
  const [selectedFormat, setSelectedFormat] = useState<BetFormat | null>(null)
  const [bestOfCount, setBestOfCount] = useState<3 | 5 | 7>(3)
  const [stakeMode, setStakeMode] = useState<StakeMode>('none')
  const [stakeAmount, setStakeAmount] = useState<number>(0)
  const [customStakes, setCustomStakes] = useState<Record<string, number>>({})
  const [pokerMode, setPokerMode] = useState<PokerMode>('winner_takes_all')
  const [pokerStack, setPokerStack] = useState<number>(3000)
  const [pokerRebuyStack, setPokerRebuyStack] = useState<number>(1500)
  const [stakePerMatch, setStakePerMatch] = useState<number>(20)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  useEffect(() => {
    void (async () => {
      const me = await AuthService.getCurrentUserProfile()
      if (!me) return
      setCurrentUser(me)
    })()
  }, [])

  useEffect(() => {
    if (!preselectedFriend) return
    setParticipants(prev => (prev.some(p => p.id === preselectedFriend.id) ? prev : [preselectedFriend, ...prev]))
  }, [preselectedFriend])

  const friendProfiles = useMemo<UserProfile[]>(
    () =>
      friends.map(friendship => {
        const friendId = friendship.user_a === currentUser?.id ? friendship.user_b : friendship.user_a
        return { id: friendId, nick: nick(friendId), avatarUrl: avatar(friendId) }
      }),
    [avatar, currentUser?.id, friends, nick],
  )

  const recentGames = useMemo(() => {
    const ids = [...new Set(bets.map(b => b.game_template))].slice(0, 3)
    return ids.map(id => GAME_TEMPLATES.find(g => g.id === id)).filter(Boolean) as GameTemplate[]
  }, [bets])

  const gamesFiltered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return GAME_TEMPLATES
    return GAME_TEMPLATES.filter(game => game.name.toLowerCase().includes(query))
  }, [searchQuery])

  const availableFormats = useMemo(
    () => (selectedGame ? getAvailableFormats(selectedGame, participants.length) : []),
    [participants.length, selectedGame],
  )

  useEffect(() => {
    if (!selectedGame || step !== 2) return
    const nextDefault = getDefaultFormat(selectedGame, participants.length)
    setSelectedFormat(prev => (prev && availableFormats.includes(prev) ? prev : nextDefault))
  }, [availableFormats, participants.length, selectedGame, step])

  const totalPlayers = participants.length + 1

  const sectionData = useMemo(
    () =>
      [
        { title: 'OSTATNIO UZYWANE', data: recentGames, show: recentGames.length > 0 },
        { title: 'SPORT', data: GAME_TEMPLATES.filter(g => g.category === 'sport'), show: true },
        { title: 'GRY VIDEO', data: GAME_TEMPLATES.filter(g => g.category === 'video'), show: true },
        { title: 'PLANSZOWE', data: GAME_TEMPLATES.filter(g => g.category === 'planszowe'), show: true },
        { title: 'INNE', data: GAME_TEMPLATES.filter(g => g.category === 'inne'), show: true },
      ].filter(section => section.show),
    [recentGames],
  )

  const handleGameSelect = useCallback((game: GameTemplate) => {
    setSelectedGame(game)
    setStep(2)
  }, [])

  const toggleParticipant = useCallback((friend: UserProfile) => {
    setParticipants(prev =>
      prev.some(p => p.id === friend.id) ? prev.filter(p => p.id !== friend.id) : [...prev, friend],
    )
  }, [])

  const handleBack = useCallback(() => {
    if (step === 1) {
      Alert.alert('Anulowac?', 'Stracisz wprowadzone dane.', [
        { text: 'Kontynuuj', style: 'cancel' },
        { text: 'Anuluj zaklad', onPress: () => navigation.goBack() },
      ])
      return
    }
    setStep(prev => (prev - 1) as NewBetStep)
  }, [navigation, step])

  const handleSubmit = useCallback(async () => {
    if (!selectedGame || !selectedFormat || !currentUser) return
    const allParticipants = [currentUser, ...participants]
    const participantRows = allParticipants.map(player => ({
      id: player.id,
      nick: player.nick,
      customStake: String(stakeMode === 'custom' ? customStakes[player.id] ?? 0 : stakeAmount),
    }))

    log('[handleSubmit] stakePerMatch:', stakePerMatch)
    log('[handleSubmit] selectedFormat:', selectedFormat)

    await createBet({
      creatorId: currentUser.id,
      gameTemplate: selectedGame.id,
      format: selectedFormat,
      stakeMode,
      participants: participantRows,
      globalStake: stakeMode === 'equal' ? stakeAmount : 0,
      bestOfCount: selectedFormat === 'best_of' ? bestOfCount : undefined,
      stakePerMatch: selectedFormat === 'per_match' ? stakePerMatch : undefined,
      stakeAmount: stakeMode === 'equal' ? stakeAmount : undefined,
      customStakes: stakeMode === 'custom' ? customStakes : undefined,
      pokerMode: selectedGame.id === 'poker' ? pokerMode : undefined,
      pokerStack: selectedGame.id === 'poker' ? pokerStack : undefined,
      pokerRebuyStack: selectedGame.id === 'poker' ? pokerRebuyStack : undefined,
      participantIds: participants.map(p => p.id),
    })

    navigation.navigate('Home')
  }, [
    bestOfCount,
    createBet,
    currentUser,
    customStakes,
    navigation,
    participants,
    pokerMode,
    pokerRebuyStack,
    pokerStack,
    selectedFormat,
    selectedGame,
    stakeAmount,
    stakeMode,
    stakePerMatch,
  ])

  const resetNewBet = useCallback(() => {
    setStep(1)
    setSelectedGame(null)
    setParticipants([])
    setSelectedFormat(null)
    setBestOfCount(3)
    setStakeMode('none')
    setStakeAmount(0)
    setStakePerMatch(0)
    setCustomStakes({})
    setPokerMode('winner_takes_all')
    setPokerStack(3000)
    setPokerRebuyStack(1500)
    setSearchQuery('')
    setSearchFocused(false)
  }, [])

  const state: NewBetState = {
    currentUser,
    selectedGame,
    participants,
    selectedFormat,
    bestOfCount,
    stakeMode,
    stakeAmount,
    customStakes,
    pokerMode,
    pokerStack,
    pokerRebuyStack,
    stakePerMatch,
    searchQuery,
    searchFocused,
    preselectedFriend,
    availableFormats,
    friendProfiles,
    recentGames,
    gamesFiltered,
    totalPlayers,
    sectionData,
    loading,
  }

  const handlers: NewBetHandlers = {
    handleGameSelect,
    handleBack,
    handleSubmit,
    resetNewBet,
    toggleParticipant,
    setParticipants,
    setStep,
    setSelectedFormat,
    setBestOfCount,
    setStakePerMatch,
    setPokerMode,
    setPokerStack,
    setPokerRebuyStack,
    setStakeMode,
    setStakeAmount,
    setCustomStakes,
    setSearchQuery,
    setSearchFocused,
  }

  return { step, state, handlers }
}
