/** Pobieranie i mapowanie szczegółów zakładu */

import { supabase } from '../../lib/supabase'
import { parseStakeAmount } from '../../utils/odds'
import type { BetDetail, BetParticipant, BetResultRow } from '../../types/bet.types'
import { error as logError, warn } from '../../utils/logger'
import type { BetFormat, BetStatus, ParticipantRole, StakeMode } from '../../types/bet.types'
import { parseOddsNumber, normalizeUsersNick } from './_helpers'

type BetDetailRow = {
  id: string
  creator_id: string
  game_template: string
  format: BetFormat
  stake_mode: StakeMode
  status: BetStatus
  notes: string | null
  created_at: string
  stake_per_match: number | null
  bet_participants: {
    user_id: string
    stake_amount: number
    odds: number
    role: ParticipantRole
    confirmed: boolean
    users: { nick: string } | { nick: string }[] | null
  }[]
  bet_results: {
    id: string
    match_number: number
    winner_id: string
    scores: { score: string } | null
    confirmed: boolean
  }[]
}

export async function getBetDetail(betId: string): Promise<BetDetail | null> {
  const { data, error } = await supabase
    .from('bets')
    .select(`
      id, creator_id, game_template, format, stake_mode, status, notes, created_at, stake_per_match,
      bet_participants (
        user_id, stake_amount, odds, role, confirmed,
        users ( nick )
      ),
      bet_results (
        id, match_number, winner_id, scores, confirmed
      )
    `)
    .eq('id', betId)
    .maybeSingle()

  if (error) {
    logError('[getBetDetail] supabase error:', error.message, { betId })
    return null
  }
  if (!data) {
    warn('[getBetDetail] brak danych dla betId:', betId)
    return null
  }
  const betData = data as BetDetailRow

  const seenUserIds = new Set<string>()
  const participants: BetParticipant[] = betData.bet_participants
    .filter(bp => {
      if (seenUserIds.has(bp.user_id)) return false
      seenUserIds.add(bp.user_id)
      return true
    })
    .map(bp => ({
      id: bp.user_id,
      nick: normalizeUsersNick(bp.users) ?? 'Nieznany',
      stakeAmount: parseStakeAmount(bp.stake_amount),
      odds: parseOddsNumber(bp.odds),
      role: bp.role,
      confirmed: bp.confirmed,
    }))

  const rawResults = betData.bet_results ?? []
  const results: BetResultRow[] = [...rawResults]
    .sort((a, b) => a.match_number - b.match_number)
    .map(r => ({
      id: r.id,
      bet_id: betData.id,
      match_number: r.match_number,
      winner_id: r.winner_id,
      scores: { score: String((r.scores as { score?: string } | null)?.score ?? '') },
      confirmed: !!r.confirmed,
    }))

  const stakePm = betData.stake_per_match
  const stakePerMatch = stakePm != null ? Number(stakePm) : undefined

  return {
    id: betData.id,
    creatorId: String(betData.creator_id ?? ''),
    gameTemplate: betData.game_template,
    format: betData.format,
    stakeMode: betData.stake_mode,
    status: betData.status,
    notes: betData.notes,
    createdAt: betData.created_at,
    stakePerMatch: Number.isFinite(stakePerMatch) ? stakePerMatch : undefined,
    participants,
    results,
  }
}
