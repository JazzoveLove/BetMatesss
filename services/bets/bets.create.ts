import { supabase } from '../../lib/supabase'
import { NotificationsService } from '../notifications.service'
import { calcOdds, toStakeNumber } from '../../utils/odds'
import { getBetInviteCodeFromBetId, parseBetIdFromInviteCode } from '../../lib/bet-invite-url'
import type { StakeMode, BetStatus, CreateBetParams } from '../../types/bet.types'
import { log, warn } from '../../utils/logger'

export type BetInvitePreview = {
  betId: string
  inviteCode: string
  title: string
  gameTemplate: string
  stakeMode: StakeMode
  status: BetStatus
  creatorId: string
  stakeAmount: number
  alreadyParticipant: boolean
  alreadyConfirmed: boolean
}

export type ParticipantRow = {
  bet_id: string
  user_id: string
  stake_amount: number
  odds: number
  role: 'creator' | 'participant'
  confirmed: boolean
}

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
  log('[createBet] input params', {
    creatorId: params.creatorId,
    gameTemplate: params.gameTemplate,
    format: params.format,
    stakeMode: params.stakeMode,
    globalStake: params.globalStake,
    globalStakeType: typeof params.globalStake,
    participants: params.participants.map(p => ({
      id: p.id,
      nick: p.nick,
      customStake: p.customStake,
      customStakeParsed: toStakeNumber(p.customStake),
    })),
  })

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

  log('[createBet] bet_participants rows (before insert)', JSON.stringify(rows, null, 2))

  const { error: partError } = await supabase.from('bet_participants').insert(rows)
  if (partError) {
    log('[createBet] bet_participants insert error', partError)
    return { error: partError.message }
  }

  log('[createBet] bet_participants insert OK', { betId: bet.id, rowCount: rows.length })

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

  const { data } = await supabase
    .from('bet_participants')
    .select('id, confirmed')
    .eq('bet_id', preview.betId)
    .eq('user_id', userId)
    .maybeSingle()
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
