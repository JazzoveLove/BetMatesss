import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { supabase } from './supabase'
import { error, warn } from '../utils/logger'

export type BetInvitePushPayload = {
  betId: string
  fromNick: string
}

export async function registerAndSyncPushToken(userId: string): Promise<string | null> {
  if (!Device.isDevice) return null

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      })
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    if (finalStatus !== 'granted') return null

    const tokenData = await Notifications.getExpoPushTokenAsync()
    const expoPushToken = tokenData.data
    if (!expoPushToken) return null

    const { error: updateError } = await supabase
      .from('users')
      .update({ expo_push_token: expoPushToken })
      .eq('id', userId)

    if (updateError) {
      warn('[notifications] save expo_push_token failed', updateError.message)
    }

    return expoPushToken
  } catch (e) {
    error('[notifications] registerAndSyncPushToken', e)
    return null
  }
}

export async function sendExpoPushNotifications(params: {
  toTokens: string[]
  title: string
  body: string
  data?: Record<string, unknown>
}): Promise<{ error?: string }> {
  const tokens = params.toTokens.filter(Boolean)
  if (tokens.length === 0) return {}

  try {
    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: params.title,
      body: params.body,
      data: params.data ?? {},
    }))

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })

    if (!response.ok) {
      return { error: `Expo Push API HTTP ${response.status}` }
    }

    const json = (await response.json()) as { errors?: Array<{ message?: string }> }
    if (json.errors?.length) {
      return { error: json.errors.map(e => e.message ?? 'Expo push error').join(', ') }
    }

    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Błąd wysyłki push notification' }
  }
}
