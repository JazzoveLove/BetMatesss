import { supabase } from '@/shared/lib/supabase'

export type BetInviteNotification = {
  id: string
  betId: string
  fromUserId: string
  fromNick: string
  gameTemplate: string
  stakeAmount: number
  message: string
  createdAt: string
}

type NotificationRow = {
  id: string
  user_id: string
  type: string
  payload: Record<string, unknown> | null
  read: boolean
  created_at: string
}

function toBetInviteNotification(row: NotificationRow): BetInviteNotification | null {
  const payload = row.payload ?? {}
  const betId = typeof payload.betId === 'string' ? payload.betId : null
  const fromUserId = typeof payload.fromUserId === 'string' ? payload.fromUserId : null
  const fromNick = typeof payload.fromNick === 'string' ? payload.fromNick : 'Znajomy'
  const gameTemplate = typeof payload.gameTemplate === 'string' ? payload.gameTemplate : 'Gra'
  const stakeAmount = Number(payload.stakeAmount ?? 0)
  const message =
    typeof payload.message === 'string'
      ? payload.message
      : `${fromNick} zaprasza cię do zakładu: ${gameTemplate} ${stakeAmount} j.`

  if (!betId || !fromUserId) return null

  return {
    id: row.id,
    betId,
    fromUserId,
    fromNick,
    gameTemplate,
    stakeAmount,
    message,
    createdAt: row.created_at,
  }
}

async function sendBetInviteNotification(params: {
  userId: string
  fromUserId: string
  fromNick: string
  betId: string
  gameTemplate: string
  stakeAmount: number
}): Promise<{ error?: string }> {
  const message = `${params.fromNick} zaprasza cię do zakładu: ${params.gameTemplate} ${params.stakeAmount} j.`

  const { error } = await supabase.from('notifications').insert({
    user_id: params.userId,
    type: 'bet_invite',
    payload: {
      betId: params.betId,
      fromUserId: params.fromUserId,
      fromNick: params.fromNick,
      gameTemplate: params.gameTemplate,
      stakeAmount: params.stakeAmount,
      message,
    },
    read: false,
  })

  return error ? { error: error.message } : {}
}

async function sendBetInvite(params: {
  betId: string
  fromUserId: string
  fromNick: string
  toUserIds: string[]
  gameTemplate: string
  stakeByUserId?: Record<string, number>
}): Promise<{ error?: string }> {
  for (const userId of params.toUserIds) {
    if (userId === params.fromUserId) continue
    const stakeAmount = params.stakeByUserId?.[userId] ?? 0
    const result = await sendBetInviteNotification({
      userId,
      fromUserId: params.fromUserId,
      fromNick: params.fromNick,
      betId: params.betId,
      gameTemplate: params.gameTemplate,
      stakeAmount,
    })
    if (result.error) return result
  }

  return {}
}

async function getPendingBetInviteNotifications(userId: string): Promise<BetInviteNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, type, payload, read, created_at')
    .eq('user_id', userId)
    .eq('type', 'bet_invite')
    .eq('read', false)
    .order('created_at', { ascending: false })

  if (error) return []

  const invites = ((data ?? []) as NotificationRow[])
    .map(toBetInviteNotification)
    .filter((row): row is BetInviteNotification => !!row)

  if (invites.length === 0) return []

  const betIds = [...new Set(invites.map(invite => invite.betId))]

  const { data: pendingBets, error: betsError } = await supabase
    .from('bets')
    .select('id')
    .in('id', betIds)
    .eq('status', 'pending')

  if (betsError) return []

  const pendingBetIds = ((pendingBets ?? []) as { id: string }[]).map(bet => bet.id)
  if (pendingBetIds.length === 0) return []

  const { data: unconfirmed, error: participantsError } = await supabase
    .from('bet_participants')
    .select('bet_id')
    .eq('user_id', userId)
    .eq('confirmed', false)
    .in('bet_id', pendingBetIds)

  if (participantsError) return []

  const validBetIds = new Set(((unconfirmed ?? []) as { bet_id: string }[]).map(row => row.bet_id))

  return invites.filter(invite => validBetIds.has(invite.betId))
}

async function markNotificationRead(notificationId: string): Promise<{ error?: string }> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId)
  return error ? { error: error.message } : {}
}

export const NotificationsService = {
  sendBetInvite,
  sendBetInviteNotification,
  getPendingBetInviteNotifications,
  markNotificationRead,
}
