
import { supabase } from '@/shared/lib/supabase'
import { parseStakeAmount } from '@/features/bets/utils/odds'
import type { BetDetail, BetParticipant, BetResultRow , BetFormat, BetStatus, ParticipantRole, StakeMode } from '@/features/bets/types/bet.types'
import { error as logError, warn } from '@/shared/utils/logger'
import { parseOddsNumber, normalizeUsersNick } from './_helpers'

type BetDetailRow = {
  id: string
  creator_id: string
  game_template: string
  format: BetFormat
  stake_mode: StakeMode
  status: BetStatus
  created_at: string
  bet_participants: {
    user_id: string
    stake_amount: number
    odds: number
    role: ParticipantRole
    confirmed: boolean
    users: { nick: string; deleted_at: string | null } | { nick: string; deleted_at: string | null }[] | null
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
      id, creator_id, game_template, format, stake_mode, status, created_at,
      bet_participants (
        user_id, stake_amount, odds, role, confirmed,
        users ( nick, deleted_at )
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

  return {
    id: betData.id,
    creatorId: String(betData.creator_id ?? ''),
    gameTemplate: betData.game_template,
    format: betData.format,
    stakeMode: betData.stake_mode,
    status: betData.status,
    createdAt: betData.created_at,
    participants,
    results,
  }
}
