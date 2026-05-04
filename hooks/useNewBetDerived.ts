/** Dane pochodne kreatora nowego zakładu */

import { useEffect, useMemo } from 'react'
import { GAME_TEMPLATES, type GameTemplate } from '../constants/games'
import type { BetFormat } from '../types/bet.types'
import type { Friendship, UserProfile } from '../types/user.types'
import type { BetSummary } from '../types/bet.types'
import { getAvailableFormats, getDefaultFormat } from '../utils/formats'
import type { UseNewBetStateReturn } from './useNewBetState'

export type UseNewBetDerivedReturn = {
  friendProfiles: UserProfile[]
  recentGames: GameTemplate[]
  gamesFiltered: GameTemplate[]
  availableFormats: BetFormat[]
  sectionData: { title: string; data: GameTemplate[]; show: boolean }[]
  totalPlayers: number
}

export function useNewBetDerived(
  state: UseNewBetStateReturn,
  friends: Friendship[],
  nick: (id: string) => string,
  avatar: (id: string) => string | null,
  bets: BetSummary[],
): UseNewBetDerivedReturn {
  const { currentUser, searchQuery, selectedGame, participants, setSelectedFormat, step } = state

  const friendProfiles = useMemo<UserProfile[]>(
    () =>
      friends.map(friendship => {
        const friendId = friendship.userAId === currentUser?.id ? friendship.userBId : friendship.userAId
        return { id: friendId, nick: nick(friendId), avatarUrl: avatar(friendId) }
      }),
    [avatar, currentUser?.id, friends, nick],
  )

  const recentGames = useMemo(() => {
    const ids = [...new Set(bets.map(b => b.gameTemplate))].slice(0, 3)
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
  }, [availableFormats, participants.length, selectedGame, setSelectedFormat, step])

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

  return {
    friendProfiles,
    recentGames,
    gamesFiltered,
    availableFormats,
    sectionData,
    totalPlayers,
  }
}
