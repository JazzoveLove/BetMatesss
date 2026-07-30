import { supabase } from '../../lib/supabase'
import { getBetInviteCodeFromBetId, parseBetIdFromInviteCode } from '../../lib/bet-invite-url'
import type { StakeMode, BetStatus, BetInvitePreview } from '../../types/bet.types'

export async function getBetInvitePreview(
  code: string,
  userId: string,
): Promise<BetInvitePreview | { error: string }> {
  const betId = parseBetIdFromInviteCode(code)
  if (!betId) return { error: 'Nieprawidłowy kod zaproszenia.' }

  const { data: bet, error: betError } = await supabase
    .from('bets')
    .select('id, game_template, stake_mode, status, notes, creator_id')
    .eq('id', betId)
    .maybeSingle()

  if (betError || !bet) return { error: 'Nie znaleziono zakładu.' }

  const { data: participants, error: participantsError } = await supabase
    .from('bet_participants')
    .select('user_id, stake_amount, confirmed, role')
    .eq('bet_id', betId)

  if (participantsError) return { error: participantsError.message }

  const betData = bet as {
    id: string
    game_template: string
    stake_mode: StakeMode
    status: BetStatus
    notes: string | null
    creator_id: string
  }

  const rows = (participants ?? []) as {
    user_id: string
    stake_amount: number
    confirmed: boolean
    role: string
  }[]

  const creatorParticipant = rows.find(row => row.user_id === betData.creator_id)
  const currentUserParticipant = rows.find(row => row.user_id === userId)

  return {
    betId: betData.id,
    inviteCode: getBetInviteCodeFromBetId(betData.id),
    title: betData.notes?.trim() || `Zakład #${String(betData.id).slice(0, 8)}`,
    gameTemplate: betData.game_template,
    stakeMode: betData.stake_mode,
    status: betData.status,
    creatorId: betData.creator_id,
    stakeAmount: Number(creatorParticipant?.stake_amount ?? 0),
    alreadyParticipant: !!currentUserParticipant,
    alreadyConfirmed: !!currentUserParticipant?.confirmed,
  }
}

export async function joinBetFromInvite(
  code: string,
  userId: string,
): Promise<{ betId: string } | { error: string }> {
  const preview = await getBetInvitePreview(code, userId)
  if ('error' in preview) return preview
  if (preview.status === 'completed') return { error: 'Zakład jest już zakończony.' }
  if (preview.creatorId === userId) return { betId: preview.betId }

  const { data, error } = await supabase
    .from('bet_participants')
    .select('id, confirmed')
    .eq('bet_id', preview.betId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return { error: error.message }
  const existingParticipant = data as {
    id: string
    confirmed: boolean
  } | null

  if (existingParticipant) {
    if (!existingParticipant.confirmed) {
      const { error: updErr } = await supabase
        .from('bet_participants')
        .update({ confirmed: true })
        .eq('id', existingParticipant.id)
      if (updErr) return { error: updErr.message }
    }
  } else {
    const { error: insErr } = await supabase.from('bet_participants').insert({
      bet_id: preview.betId,
      user_id: userId,
      stake_amount: preview.stakeAmount,
      odds: 0,
      role: 'participant',
      confirmed: true,
    })
    if (insErr) return { error: insErr.message }
  }

  const { data: allParticipants, error: allErr } = await supabase
    .from('bet_participants')
    .select('confirmed')
    .eq('bet_id', preview.betId)

  if (allErr) return { error: allErr.message }

  const everyoneConfirmed = ((allParticipants ?? []) as { confirmed: boolean }[]).every(p => p.confirmed)
  if (everyoneConfirmed) {
    const { error: updateStatusError } = await supabase
      .from('bets')
      .update({ status: 'active' })
      .eq('id', preview.betId)
      .eq('status', 'pending')
    if (updateStatusError) return { error: updateStatusError.message }
  }

  return { betId: preview.betId }
}
