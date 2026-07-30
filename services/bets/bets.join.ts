import { supabase } from '../../lib/supabase'
import { getBetInviteCodeFromBetId, parseBetIdFromInviteCode } from '../../lib/bet-invite-url'
import type { StakeMode, BetStatus, BetInvitePreview } from '../../types/bet.types'
import { log } from '../../utils/logger'

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
  log('[joinBetFromInvite] start', { code, userId })
  const preview = await getBetInvitePreview(code, userId)
  log('[joinBetFromInvite] preview result', preview)
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
  log('[joinBetFromInvite] existing participant', existingParticipant)

  if (existingParticipant) {
    if (!existingParticipant.confirmed) {
      log('[joinBetFromInvite] updating confirmed=true', {
        betId: preview.betId,
        userId,
        participantId: existingParticipant.id,
      })
      const { error: updErr } = await supabase
        .from('bet_participants')
        .update({ confirmed: true })
        .eq('id', existingParticipant.id)
      if (updErr) log('[joinBetFromInvite] update confirmed failed', updErr)
      if (updErr) return { error: updErr.message }
      log('[joinBetFromInvite] update confirmed success')
    }
  } else {
    log('[joinBetFromInvite] inserting participant with confirmed=true', {
      betId: preview.betId,
      userId,
      stakeAmount: preview.stakeAmount,
    })
    const { error: insErr } = await supabase.from('bet_participants').insert({
      bet_id: preview.betId,
      user_id: userId,
      stake_amount: preview.stakeAmount,
      odds: 0,
      role: 'participant',
      confirmed: true,
    })
    if (insErr) log('[joinBetFromInvite] insert participant failed', insErr)
    if (insErr) return { error: insErr.message }
    log('[joinBetFromInvite] insert participant success')
  }

  const { data: allParticipants, error: allErr } = await supabase
    .from('bet_participants')
    .select('confirmed')
    .eq('bet_id', preview.betId)
  log('[joinBetFromInvite] all participants confirmed rows', allParticipants)

  if (allErr) return { error: allErr.message }

  const everyoneConfirmed = ((allParticipants ?? []) as { confirmed: boolean }[]).every(p => p.confirmed)
  log('[joinBetFromInvite] everyone confirmed?', {
    betId: preview.betId,
    everyoneConfirmed,
  })
  if (everyoneConfirmed) {
    log('[joinBetFromInvite] updating bet status to active', { betId: preview.betId })
    const { error: updateStatusError } = await supabase
      .from('bets')
      .update({ status: 'active' })
      .eq('id', preview.betId)
      .eq('status', 'pending')
    if (updateStatusError) log('[joinBetFromInvite] update bet status failed', updateStatusError)
    if (updateStatusError) return { error: updateStatusError.message }
    log('[joinBetFromInvite] update bet status success')
  }

  log('[joinBetFromInvite] done', { betId: preview.betId })
  return { betId: preview.betId }
}
