import { supabase } from '../lib/supabase'
import { calcOdds, parseStakeAmount, toStakeNumber } from '../utils/odds'
import { createSettlements, getSettlements, markSettlementPaid } from './settlements.service'
import { getBetInviteCodeFromBetId, parseBetIdFromInviteCode } from '../lib/bet-invite-url'
import { getAcceptedFriendsList, loadNicksByIds } from './friends.service'
import type {
  Bet,
  BetDetail,
  BetParticipant,
  Settlement,
  ActiveBetItem,
  RecentResult,
  DashboardStats,
  StakeMode,
  NewBetParticipant,
  BetStatus,
  CreateBetParams,
  HistoryListItem,
  HistoryBadgeLabel,
  DisciplineStatRow,
  FriendRankRow,
  ProfileScreenData,
} from '../types/bet.types'

function parseOddsNumber(value: number | string | undefined): number {
  if (value == null) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const n = Number(String(value).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

function normalizeUsersNick(raw: unknown): string | null {
  if (raw == null) return null
  if (Array.isArray(raw)) {
    const first = raw[0] as { nick?: unknown } | undefined
    const n = first?.nick
    return typeof n === 'string' && n.trim().length > 0 ? n.trim() : null
  }
  const n = (raw as { nick?: unknown }).nick
  return typeof n === 'string' && n.trim().length > 0 ? n.trim() : null
}

// ─── Create ───────────────────────────────────────────────────────────────────

async function createBet(
  params: CreateBetParams,
): Promise<{ betId: string } | { error: string }> {
  console.log('[createBet] input params', {
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
    })
    .select('id')
    .single()

  if (betError || !bet) {
    return { error: betError?.message ?? 'Nie udało się utworzyć zakładu.' }
  }

  const globalParsed = toStakeNumber(params.globalStake)
  const rows = params.participants.map(p => {
    const amount =
      params.stakeMode === 'custom'
        ? toStakeNumber(p.customStake)
        : params.stakeMode === 'none'
        ? 0
        : globalParsed
    const odds = calcOdds(amount, params.participants, globalParsed, params.stakeMode)
    return {
      bet_id: bet.id,
      user_id: p.id,
      stake_amount: amount,
      odds,
      role: p.id === params.creatorId ? 'creator' : 'participant',
      confirmed: p.id === params.creatorId,
    }
  })

  console.log('[createBet] bet_participants rows (before insert)', JSON.stringify(rows, null, 2))

  const { error: partError } = await supabase.from('bet_participants').insert(rows)
  if (partError) {
    console.log('[createBet] bet_participants insert error', partError)
    return { error: partError.message }
  }

  console.log('[createBet] bet_participants insert OK', { betId: bet.id, rowCount: rows.length })
  return { betId: bet.id }
}

type BetInvitePreview = {
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

async function getBetInvitePreview(
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

  const rows = (participants ?? []) as {
    user_id: string
    stake_amount: number
    confirmed: boolean
    role: string
  }[]

  const creatorParticipant = rows.find(row => row.user_id === (bet as any).creator_id)
  const currentUserParticipant = rows.find(row => row.user_id === userId)

  return {
    betId: (bet as any).id,
    inviteCode: getBetInviteCodeFromBetId((bet as any).id),
    title: (bet as any).notes?.trim() || `Zakład #${String((bet as any).id).slice(0, 8)}`,
    gameTemplate: (bet as any).game_template,
    stakeMode: (bet as any).stake_mode,
    status: (bet as any).status,
    creatorId: (bet as any).creator_id,
    stakeAmount: Number(creatorParticipant?.stake_amount ?? 0),
    alreadyParticipant: !!currentUserParticipant,
    alreadyConfirmed: !!currentUserParticipant?.confirmed,
  }
}

async function joinBetFromInvite(
  code: string,
  userId: string,
): Promise<{ betId: string } | { error: string }> {
  console.log('[joinBetFromInvite] start', { code, userId })
  const preview = await getBetInvitePreview(code, userId)
  console.log('[joinBetFromInvite] preview result', preview)
  if ('error' in preview) return preview
  if (preview.status === 'completed') return { error: 'Zakład jest już zakończony.' }
  if (preview.creatorId === userId) return { betId: preview.betId }

  const { data: existingParticipant } = await supabase
    .from('bet_participants')
    .select('id, confirmed')
    .eq('bet_id', preview.betId)
    .eq('user_id', userId)
    .maybeSingle()
  console.log('[joinBetFromInvite] existing participant', existingParticipant)

  if (existingParticipant) {
    if (!(existingParticipant as any).confirmed) {
      console.log('[joinBetFromInvite] updating confirmed=true', {
        betId: preview.betId,
        userId,
        participantId: (existingParticipant as any).id,
      })
      const { error: updErr } = await supabase
        .from('bet_participants')
        .update({ confirmed: true })
        .eq('id', (existingParticipant as any).id)
      if (updErr) console.log('[joinBetFromInvite] update confirmed failed', updErr)
      if (updErr) return { error: updErr.message }
      console.log('[joinBetFromInvite] update confirmed success')
    }
  } else {
    console.log('[joinBetFromInvite] inserting participant with confirmed=true', {
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
    if (insErr) console.log('[joinBetFromInvite] insert participant failed', insErr)
    if (insErr) return { error: insErr.message }
    console.log('[joinBetFromInvite] insert participant success')
  }

  const { data: allParticipants, error: allErr } = await supabase
    .from('bet_participants')
    .select('confirmed')
    .eq('bet_id', preview.betId)
  console.log('[joinBetFromInvite] all participants confirmed rows', allParticipants)

  if (allErr) return { error: allErr.message }

  const everyoneConfirmed = ((allParticipants ?? []) as { confirmed: boolean }[]).every(p => p.confirmed)
  console.log('[joinBetFromInvite] everyone confirmed?', {
    betId: preview.betId,
    everyoneConfirmed,
  })
  if (everyoneConfirmed) {
    console.log('[joinBetFromInvite] updating bet status to active', { betId: preview.betId })
    const { error: updateStatusError } = await supabase
      .from('bets')
      .update({ status: 'active' })
      .eq('id', preview.betId)
      .eq('status', 'pending')
    if (updateStatusError) console.log('[joinBetFromInvite] update bet status failed', updateStatusError)
    if (updateStatusError) return { error: updateStatusError.message }
    console.log('[joinBetFromInvite] update bet status success')
  }

  console.log('[joinBetFromInvite] done', { betId: preview.betId })
  return { betId: preview.betId }
}

// ─── Read ─────────────────────────────────────────────────────────────────────

async function getBetDetail(betId: string): Promise<BetDetail | null> {
  const { data, error } = await supabase
    .from('bets')
    .select(`
      id, game_template, format, stake_mode, status, notes, created_at,
      bet_participants (
        user_id, stake_amount, odds, role, confirmed,
        users ( nick )
      )
    `)
    .eq('id', betId)
    .single()

  if (error || !data) return null

  const seenUserIds = new Set<string>()
  const participants: BetParticipant[] = ((data as any).bet_participants ?? [])
    .filter((bp: any) => {
      if (seenUserIds.has(bp.user_id)) return false
      seenUserIds.add(bp.user_id)
      return true
    })
    .map((bp: any) => ({
      id: bp.user_id,
      nick: normalizeUsersNick(bp.users) ?? 'Nieznany',
      stakeAmount: parseStakeAmount(bp.stake_amount),
      odds: parseOddsNumber(bp.odds),
      role: bp.role,
      confirmed: bp.confirmed,
    }))

  return {
    id: data.id,
    gameTemplate: (data as any).game_template,
    format: (data as any).format,
    stakeMode: (data as any).stake_mode,
    status: (data as any).status,
    notes: (data as any).notes,
    createdAt: (data as any).created_at,
    participants,
  }
}

// ─── Resolve ──────────────────────────────────────────────────────────────────
// getSettlements / markSettlementPaid / createSettlements → settlements.service.ts

type ResolveParams = {
  betId: string
  winnerId: string
  score: string
  recordedBy: string
}

type PendingBetResult = {
  id: string
  winnerId: string
  score: string
  recordedBy: string
  confirmed: boolean
}

async function submitBetResult(params: ResolveParams): Promise<{ error?: string }> {
  const { error: resultError } = await supabase.from('bet_results').insert({
    bet_id: params.betId,
    match_number: 1,
    winner_id: params.winnerId,
    scores: { score: params.score },
    recorded_by: params.recordedBy,
    confirmed: false,
  })
  if (resultError) return { error: resultError.message }

  const { error: betError } = await supabase
    .from('bets')
    .update({ status: 'awaiting_confirmation' })
    .eq('id', params.betId)
  if (betError) return { error: betError.message }

  return {}
}

async function getPendingBetResult(betId: string): Promise<PendingBetResult | null> {
  const { data, error } = await supabase
    .from('bet_results')
    .select('id, winner_id, scores, recorded_by, confirmed')
    .eq('bet_id', betId)
    .eq('confirmed', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null

  return {
    id: (data as any).id,
    winnerId: (data as any).winner_id,
    score: String((data as any).scores?.score ?? ''),
    recordedBy: (data as any).recorded_by,
    confirmed: !!(data as any).confirmed,
  }
}

type ConfirmResultParams = {
  betId: string
  resultId: string
  confirmerId: string
}

async function confirmBetResult(params: ConfirmResultParams): Promise<{ error?: string }> {
  console.log('[confirmBetResult] start', params)

  const { error: resultError } = await supabase
    .from('bet_results')
    .update({ confirmed: true, confirmed_by: params.confirmerId })
    .eq('id', params.resultId)
    .eq('bet_id', params.betId)

  console.log('[confirmBetResult] bet_results update', { resultError })
  if (resultError) return { error: resultError.message }

  const { error: betError } = await supabase
    .from('bets')
    .update({ status: 'completed' })
    .eq('id', params.betId)

  console.log('[confirmBetResult] bets status update', { betError })
  if (betError) return { error: betError.message }

  console.log('[confirmBetResult] calling createSettlements for betId', params.betId)
  const settlResult = await createSettlements(params.betId)
  console.log('[confirmBetResult] createSettlements result', settlResult)
  return settlResult
}

async function disputeBetResult(betId: string): Promise<{ error?: string }> {
  const { error } = await supabase.from('bets').update({ status: 'disputed' }).eq('id', betId)
  return error ? { error: error.message } : {}
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

type DashboardData = {
  nick: string
  stats: DashboardStats
  activeBets: ActiveBetItem[]
  recentResults: RecentResult[]
}

async function getDashboardData(userId: string): Promise<DashboardData> {
  const [profileRes, participationsRes, settlementsRes] = await Promise.all([
    supabase.from('users').select('nick').eq('id', userId).single(),
    supabase
      .from('bet_participants')
      .select(`
        stake_amount, odds,
        bets (
          id, game_template, status,
          bet_participants ( user_id, stake_amount, odds, users ( nick ) )
        )
      `)
      .eq('user_id', userId),
    supabase
      .from('settlements')
      .select('id, amount, paid, debtor_id, creditor_id, bet_id')
      .or(`debtor_id.eq.${userId},creditor_id.eq.${userId}`),
  ])

  const nick = (profileRes.data as any)?.nick ?? 'Graczu'

  const settlements = (settlementsRes.data ?? []) as {
    id: string
    amount: number
    paid: boolean
    debtor_id: string
    creditor_id: string
    bet_id: string
  }[]

  const balance = settlements.reduce((acc, s) => {
    if (s.creditor_id === userId) return acc + s.amount
    if (s.debtor_id === userId) return acc - s.amount
    return acc
  }, 0)

  const participations = (participationsRes.data ?? []) as unknown as {
    stake_amount: number | string
    odds: number | string
    bets: {
      id: string
      game_template: string
      status: string
      bet_participants: {
        user_id: string
        stake_amount?: number | string
        odds?: number | string
        users: { nick: string } | { nick: string }[] | null
      }[]
    } | null
  }[]

  type DashRow = {
    bet: NonNullable<(typeof participations)[0]['bets']>
    stakeAmount: number
    odds: number
    opponentUserId: string | null
    joinNick: string | null
  }

  const dashRows: DashRow[] = []
  for (const p of participations) {
    const bet = p.bets
    if (!bet) continue
    const opponent = bet.bet_participants.find(bp => bp.user_id !== userId)
    const joinNick = opponent ? normalizeUsersNick(opponent.users) : null
    dashRows.push({
      bet,
      stakeAmount: parseStakeAmount(p.stake_amount),
      odds: parseOddsNumber(p.odds),
      opponentUserId: opponent?.user_id ?? null,
      joinNick,
    })
  }

  const needNickIds = [
    ...new Set(
      dashRows
        .filter(r => !r.joinNick && r.opponentUserId)
        .map(r => r.opponentUserId as string),
    ),
  ]
  const extraNicks = needNickIds.length > 0 ? await loadNicksByIds(needNickIds) : {}

  const opponentNickFor = (r: DashRow) =>
    r.joinNick ?? (r.opponentUserId ? extraNicks[r.opponentUserId] : undefined) ?? 'Przeciwnik'

  const active: ActiveBetItem[] = []
  const completed: { id: string; gameTemplate: string; opponentNick: string }[] = []
  const seenBetIds = new Set<string>()

  for (const r of dashRows) {
    const { bet } = r
    if (seenBetIds.has(bet.id)) continue
    seenBetIds.add(bet.id)
    const opponentNick = opponentNickFor(r)
    if (
      bet.status === 'active' ||
      bet.status === 'pending' ||
      bet.status === 'awaiting_confirmation' ||
      bet.status === 'in_progress'
    ) {
      active.push({
        id: bet.id,
        gameTemplate: bet.game_template,
        status: bet.status as BetStatus,
        stakeAmount: r.stakeAmount,
        odds: r.odds,
        opponentNick,
      })
    } else if (bet.status === 'completed') {
      completed.push({ id: bet.id, gameTemplate: bet.game_template, opponentNick })
    }
  }

  const completedIds = new Set(completed.map(b => b.id))
  const wins = settlements.filter(s => s.creditor_id === userId && completedIds.has(s.bet_id)).length
  const winRate = completedIds.size > 0 ? Math.round((wins / completedIds.size) * 100) : 0

  const recentResults: RecentResult[] = completed.slice(0, 3).map(b => {
    const s = settlements.find(s => s.bet_id === b.id)
    const profit = s ? (s.creditor_id === userId ? s.amount : -s.amount) : 0
    return { id: b.id, gameTemplate: b.gameTemplate, opponentNick: b.opponentNick, profit }
  })

  return {
    nick,
    stats: { balance, totalBets: participations.length, winRate },
    activeBets: active,
    recentResults,
  }
}

// ─── Search ───────────────────────────────────────────────────────────────────

async function searchUsers(
  query: string,
  excludeIds: string[],
): Promise<{ id: string; nick: string }[]> {
  if (query.trim().length < 2) return []
  const { data } = await supabase
    .from('users')
    .select('id, nick')
    .ilike('nick', `%${query.trim()}%`)
    .limit(5)
  const excludeSet = new Set(excludeIds)
  return (data ?? []).filter(u => !excludeSet.has(u.id))
}

async function getUserBets(userId: string): Promise<Bet[]> {
  const [createdRes, participantsRes] = await Promise.all([
    supabase.from('bets').select('*').eq('creator_id', userId).order('created_at', { ascending: false }),
    supabase
      .from('bet_participants')
      .select('bets(*)')
      .eq('user_id', userId),
  ])
  const created = (createdRes.data ?? []) as Bet[]
  const participated = ((participantsRes.data ?? []) as { bets: Bet | Bet[] | null }[])
    .flatMap(row => (Array.isArray(row.bets) ? row.bets : row.bets ? [row.bets] : []))
  const byId = new Map<string, Bet>()
  for (const bet of [...created, ...participated]) byId.set(bet.id, bet)
  return [...byId.values()].sort((a, b) => b.created_at.localeCompare(a.created_at))
}

function historyBadgeAndAmount(
  bet: Bet,
  profit: number,
  hadSettlement: boolean,
): { badge: HistoryBadgeLabel; amountLabel: string } {
  const st = bet.status
  if (st === 'pending') return { badge: 'oczekuje', amountLabel: '—' }
  if (st === 'disputed') return { badge: 'spór', amountLabel: '—' }
  if (st === 'active' || st === 'in_progress' || st === 'awaiting_confirmation') {
    return { badge: 'aktywny', amountLabel: '—' }
  }
  if (st === 'completed') {
    if (!hadSettlement) {
      return { badge: 'zakończony', amountLabel: '0 zł' }
    }
    const sign = profit > 0 ? '+' : ''
    if (profit === 0) {
      return { badge: 'zakończony', amountLabel: '0 zł' }
    }
    return {
      badge: profit > 0 ? 'wygrany' : 'przegrany',
      amountLabel: `${sign}${profit} zł`,
    }
  }
  return { badge: 'oczekuje', amountLabel: '—' }
}

async function getHistoryForUser(userId: string): Promise<HistoryListItem[]> {
  const bets = await getUserBets(userId)
  if (bets.length === 0) return []

  const betIds = bets.map(b => b.id)
  const [{ data: parts }, { data: settlements }] = await Promise.all([
    supabase
      .from('bet_participants')
      .select('bet_id, user_id, users ( nick )')
      .in('bet_id', betIds),
    supabase.from('settlements').select('bet_id, debtor_id, creditor_id, amount').in('bet_id', betIds),
  ])

  const settlementsList = (settlements ?? []) as {
    bet_id: string
    debtor_id: string
    creditor_id: string
    amount: number
  }[]

  const partsList = ((parts ?? []) as unknown as {
    bet_id: string
    user_id: string
    users: { nick: string } | { nick: string }[] | null
  }[]).map(p => ({
    bet_id: p.bet_id,
    user_id: p.user_id,
    nick: normalizeUsersNick(p.users),
  }))

  const byBetParts = new Map<string, typeof partsList>()
  for (const p of partsList) {
    const arr = byBetParts.get(p.bet_id) ?? []
    arr.push(p)
    byBetParts.set(p.bet_id, arr)
  }

  const items: HistoryListItem[] = []
  const betOpponentId = new Map<string, string>()
  for (const bet of bets) {
    const plist = byBetParts.get(bet.id) ?? []
    const opponent = plist.find(p => p.user_id !== userId)
    const joinNick = opponent?.nick ?? null
    if (opponent?.user_id) betOpponentId.set(bet.id, opponent.user_id)
    const opponentNick = joinNick ?? 'Przeciwnik'

    const betSettle = settlementsList.filter(s => s.bet_id === bet.id)
    let profit = 0
    for (const s of betSettle) {
      if (s.creditor_id === userId) profit += Number(s.amount)
      if (s.debtor_id === userId) profit -= Number(s.amount)
    }
    const hadSettlement = betSettle.length > 0
    const { badge, amountLabel } = historyBadgeAndAmount(bet, profit, hadSettlement)

    items.push({
      id: bet.id,
      gameTemplate: bet.game_template,
      createdAt: bet.created_at,
      opponentNick,
      badge,
      amountLabel,
      profit,
    })
  }

  const missingOppIds = [
    ...new Set(
      items
        .filter(i => i.opponentNick === 'Przeciwnik')
        .map(i => betOpponentId.get(i.id))
        .filter((id): id is string => !!id),
    ),
  ]
  if (missingOppIds.length === 0) return items
  const extra = await loadNicksByIds(missingOppIds)
  return items.map(item => {
    const oid = betOpponentId.get(item.id)
    if (item.opponentNick === 'Przeciwnik' && oid && extra[oid]) {
      return { ...item, opponentNick: extra[oid] }
    }
    return item
  })
}

async function getDisciplineStatsForUser(userId: string): Promise<DisciplineStatRow[]> {
  const bets = await getUserBets(userId)
  const completed = bets.filter(b => b.status === 'completed')
  if (completed.length === 0) return []

  const betIds = completed.map(b => b.id)
  const { data: settlements } = await supabase
    .from('settlements')
    .select('bet_id, debtor_id, creditor_id')
    .in('bet_id', betIds)

  const settlementsList = (settlements ?? []) as {
    bet_id: string
    debtor_id: string
    creditor_id: string
  }[]

  const byTemplate = new Map<string, { w: number; l: number }>()
  for (const bet of completed) {
    const rel = settlementsList.filter(s => s.bet_id === bet.id)
    if (rel.length === 0) continue
    const won = rel.some(s => s.creditor_id === userId)
    const lost = rel.some(s => s.debtor_id === userId)
    if (!won && !lost) continue
    const tmpl = bet.game_template
    const agg = byTemplate.get(tmpl) ?? { w: 0, l: 0 }
    if (won) agg.w += 1
    else if (lost) agg.l += 1
    byTemplate.set(tmpl, agg)
  }

  return [...byTemplate.entries()]
    .map(([gameTemplate, { w, l }]) => ({
      gameTemplate,
      wins: w,
      losses: l,
      winPct: w + l > 0 ? Math.round((w / (w + l)) * 100) : 0,
    }))
    .sort((a, b) => b.wins + b.losses - (a.wins + a.losses))
}

async function getFriendsBalanceLeaderboard(userId: string): Promise<FriendRankRow[]> {
  const friends = await getAcceptedFriendsList(userId)
  if (friends.length === 0) return []

  const ids = friends.map(f => f.id)
  const [debtorRes, creditorRes] = await Promise.all([
    supabase.from('settlements').select('id, amount, debtor_id, creditor_id').in('debtor_id', ids),
    supabase.from('settlements').select('id, amount, debtor_id, creditor_id').in('creditor_id', ids),
  ])

  const seen = new Set<string>()
  const rows: { amount: number; debtor_id: string; creditor_id: string }[] = []
  for (const list of [debtorRes.data ?? [], creditorRes.data ?? []]) {
    for (const r of list as { id: string; amount: number; debtor_id: string; creditor_id: string }[]) {
      if (seen.has(r.id)) continue
      seen.add(r.id)
      rows.push({
        amount: Number(r.amount),
        debtor_id: r.debtor_id,
        creditor_id: r.creditor_id,
      })
    }
  }

  const balanceById: Record<string, number> = Object.fromEntries(ids.map(i => [i, 0]))
  for (const s of rows) {
    if (ids.includes(s.creditor_id)) balanceById[s.creditor_id] += s.amount
    if (ids.includes(s.debtor_id)) balanceById[s.debtor_id] -= s.amount
  }

  return friends
    .map(f => ({ id: f.id, nick: f.nick, balance: balanceById[f.id] ?? 0 }))
    .sort((a, b) => b.balance - a.balance)
}

async function getProfileScreenData(userId: string): Promise<ProfileScreenData | null> {
  const { data: userRow, error: userErr } = await supabase
    .from('users')
    .select('nick, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (userErr || !userRow) return null

  const [dashboard, disciplines, friendsRank] = await Promise.all([
    getDashboardData(userId),
    getDisciplineStatsForUser(userId),
    getFriendsBalanceLeaderboard(userId),
  ])

  return {
    nick: (userRow as { nick: string }).nick,
    createdAt: (userRow as { created_at?: string | null }).created_at ?? null,
    stats: dashboard.stats,
    disciplines,
    friendsRank,
  }
}

async function updateBetStatus(id: string, status: BetStatus): Promise<void> {
  await supabase.from('bets').update({ status }).eq('id', id)
}

async function addParticipant(
  betId: string,
  userId: string,
  stake: number,
): Promise<{ error?: string }> {
  const { error } = await supabase.from('bet_participants').insert({
    bet_id: betId,
    user_id: userId,
    stake_amount: stake,
    odds: 0,
    role: 'participant',
    confirmed: false,
  })
  return error ? { error: error.message } : {}
}

async function confirmParticipation(betId: string, userId: string): Promise<{ error?: string }> {
  console.log('[confirmParticipation] start', { betId, userId })
  console.log('[confirmParticipation] updating participant confirmed=true', { betId, userId })
  const { error: confirmError } = await supabase
    .from('bet_participants')
    .update({ confirmed: true })
    .eq('bet_id', betId)
    .eq('user_id', userId)
  if (confirmError) console.log('[confirmParticipation] update confirmed failed', confirmError)

  if (confirmError) return { error: confirmError.message }
  console.log('[confirmParticipation] update confirmed success')

  const { data: allParticipants, error: allError } = await supabase
    .from('bet_participants')
    .select('confirmed')
    .eq('bet_id', betId)
  console.log('[confirmParticipation] all participants confirmed rows', allParticipants)

  if (allError) return { error: allError.message }

  const everyoneConfirmed = ((allParticipants ?? []) as { confirmed: boolean }[]).every(p => p.confirmed)
  console.log('[confirmParticipation] everyone confirmed?', { betId, everyoneConfirmed })
  if (everyoneConfirmed) {
    console.log('[confirmParticipation] updating bet status to active', { betId })
    const { error: statusError } = await supabase
      .from('bets')
      .update({ status: 'active' })
      .eq('id', betId)
      .eq('status', 'pending')
    if (statusError) console.log('[confirmParticipation] update bet status failed', statusError)
    if (statusError) return { error: statusError.message }
    console.log('[confirmParticipation] update bet status success')
  }

  console.log('[confirmParticipation] done', { betId, userId })
  return {}
}

async function rejectParticipation(betId: string, userId: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('bet_participants')
    .delete()
    .eq('bet_id', betId)
    .eq('user_id', userId)
  return error ? { error: error.message } : {}
}

export const BetsService = {
  createBet,
  getBetInvitePreview,
  joinBetFromInvite,
  getBet: getBetDetail,
  getBetDetail,
  getUserBets,
  getHistoryForUser,
  getProfileScreenData,
  updateBetStatus,
  addParticipant,
  confirmParticipation,
  rejectParticipation,
  getSettlements,
  submitBetResult,
  getPendingBetResult,
  confirmBetResult,
  disputeBetResult,
  markSettlementPaid,
  getDashboardData,
  searchUsers,
}

export {
  createBet,
  getBetInvitePreview,
  joinBetFromInvite,
  getBetDetail,
  getSettlements,
  submitBetResult,
  getPendingBetResult,
  confirmBetResult,
  disputeBetResult,
  markSettlementPaid,
  getDashboardData,
  searchUsers,
  getHistoryForUser,
  getProfileScreenData,
}
