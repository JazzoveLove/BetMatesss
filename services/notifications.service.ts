import { supabase } from '../lib/supabase'
import { sendExpoPushNotifications } from '../lib/notifications'

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
      : `${fromNick} zaprasza cię do zakładu: ${gameTemplate} ${stakeAmount} zł`

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
  const message = `${params.fromNick} zaprasza cię do zakładu: ${params.gameTemplate} ${params.stakeAmount} zł`

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

/**
 * Zapis zaproszeń w tabeli `notifications` (widok w Znajomi / odświeżenie listy).
 * Prawdziwy push na iOS/Android wymaga `expo-notifications`, zapisu Expo Push Token w Supabase
 * oraz Edge Function lub serwera wywołującego https://exp.host/--/api/v2/push/send —
 * obecnie w projekcie tego nie ma.
 */
async function sendBetInvite(params: {
  betId: string
  fromUserId: string
  fromNick: string
  toUserIds: string[]
  gameTemplate: string
  stakeByUserId?: Record<string, number>
}): Promise<{ error?: string }> {
  const invitedUserIds = params.toUserIds.filter(userId => userId !== params.fromUserId)
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

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, expo_push_token')
    .in('id', invitedUserIds)

  if (usersError) return { error: usersError.message }

  const pushTokens = ((users ?? []) as Array<{ id: string; expo_push_token?: string | null }>)
    .map(row => row.expo_push_token ?? '')
    .filter(Boolean)

  const pushResult = await sendExpoPushNotifications({
    toTokens: pushTokens,
    title: `${params.fromNick} zaprasza Cię do zakładu!`,
    body: 'Kliknij, aby zobaczyć szczegóły zakładu.',
    data: {
      type: 'bet_invite',
      betId: params.betId,
      fromUserId: params.fromUserId,
    },
  })

  if (pushResult.error) return pushResult
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

  return ((data ?? []) as NotificationRow[])
    .map(toBetInviteNotification)
    .filter((row): row is BetInviteNotification => !!row)
}

async function markNotificationRead(notificationId: string): Promise<{ error?: string }> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId)
  return error ? { error: error.message } : {}
}

async function sendSettlementReminderNotification(params: {
  debtorUserId: string
  creditorNick: string
  betId: string
  amount: number
}): Promise<{ error?: string }> {
  const message = `${params.creditorNick} przypomina o spłacie ${params.amount} zł (zakład).`
  const { error } = await supabase.from('notifications').insert({
    user_id: params.debtorUserId,
    type: 'settlement_reminder',
    payload: {
      betId: params.betId,
      amount: params.amount,
      creditorNick: params.creditorNick,
      message,
    },
    read: false,
  })
  return error ? { error: error.message } : {}
}

export const NotificationsService = {
  sendBetInvite,
  sendBetInviteNotification,
  getPendingBetInviteNotifications,
  markNotificationRead,
  sendSettlementReminderNotification,
}
