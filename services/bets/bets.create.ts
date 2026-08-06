import { supabase } from '@/shared/lib/supabase'
import { NotificationsService } from '@/shared/services/notifications.service'
import { calcOdds, toStakeNumber } from '../../utils/odds'
import type { CreateBetParams, ParticipantRow } from '../../types/bet.types'
import { warn } from '@/shared/utils/logger'

export function buildParticipantRows(
  betId: string,
  params: Pick<CreateBetParams, 'creatorId' | 'stakeMode' | 'globalStake' | 'participants'>,
): ParticipantRow[] {
  const globalParsed = toStakeNumber(params.globalStake)
  return params.participants.map(p => {
    const amount =
      params.stakeMode === 'custom'
        ? toStakeNumber(p.customStake)
        : params.stakeMode === 'none'
        ? 0
        : globalParsed
    const odds = calcOdds(amount, params.participants, globalParsed, params.stakeMode)
    return {
      bet_id: betId,
      user_id: p.id,
      stake_amount: amount,
      odds,
      role: p.id === params.creatorId ? 'creator' : 'participant',
      confirmed: p.id === params.creatorId,
    }
  })
}

export async function createBet(
  params: CreateBetParams,
): Promise<{ betId: string } | { error: string }> {
  const { data: bet, error: betError } = await supabase
    .from('bets')
    .insert({
      creator_id: params.creatorId,
      game_template: params.gameTemplate,
      format: params.format,
      stake_mode: params.stakeMode,
      status: 'pending',
      ...(params.format === 'per_match'
        ? { stake_per_match: Math.max(0, Number(params.stakePerMatch ?? 0)) }
        : {}),
    })
    .select('id')
    .single()

  if (betError || !bet) {
    return { error: betError?.message ?? 'Nie udało się utworzyć zakładu.' }
  }

  const rows = buildParticipantRows(bet.id, params)

  const { error: partError } = await supabase.from('bet_participants').insert(rows)
  if (partError) {
    return { error: partError.message }
  }

  const creatorNick = params.participants.find(p => p.id === params.creatorId)?.nick ?? 'Znajomy'
  const toUserIds = rows.filter(r => r.user_id !== params.creatorId).map(r => r.user_id)
  const stakeByUserId = Object.fromEntries(rows.map(r => [r.user_id, r.stake_amount]))
  if (toUserIds.length > 0) {
    const notifResult = await NotificationsService.sendBetInvite({
      betId: bet.id,
      fromUserId: params.creatorId,
      fromNick: creatorNick,
      toUserIds,
      gameTemplate: params.gameTemplate,
      stakeByUserId,
    })
    if (notifResult.error) {
      warn('[createBet] sendBetInvite failed', notifResult.error)
    }
  }

  return { betId: bet.id }
}
