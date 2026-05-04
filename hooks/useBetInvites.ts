import { useCallback, useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { useAuthContext } from '../contexts/AuthContext'
import { BetsService } from '../services/bets.service'
import { NotificationsService, type BetInviteNotification } from '../services/notifications.service'
import { error } from '../utils/logger'

export function useBetInvites() {
  const { userId } = useAuthContext()
  const [betInvites, setBetInvites] = useState<BetInviteNotification[]>([])

  const reload = useCallback(async () => {
    if (!userId) return
    const invites = await NotificationsService.getPendingBetInviteNotifications(userId)
    setBetInvites(invites)
  }, [userId])

  useEffect(() => {
    void reload()
  }, [reload])

  const acceptBetInvite = useCallback(
    async (invite: BetInviteNotification) => {
      if (!userId) return
      try {
        const result = await BetsService.confirmParticipation(invite.betId, userId)
        if (result.error) {
          Alert.alert('Błąd', result.error)
          return
        }
        await NotificationsService.markNotificationRead(invite.id)
        await reload()
        Alert.alert('Dołączono', 'Zaproszenie do zakładu zostało zaakceptowane.')
      } catch (e) {
        error('[useBetInvites] acceptBetInvite', e)
        Alert.alert('Błąd', 'Nie udało się zaakceptować zaproszenia do zakładu.')
      }
    },
    [reload, userId],
  )

  const rejectBetInvite = useCallback(
    async (invite: BetInviteNotification) => {
      if (!userId) return
      try {
        const result = await BetsService.rejectParticipation(invite.betId, userId)
        if (result.error) {
          Alert.alert('Błąd', result.error)
          return
        }
        await NotificationsService.markNotificationRead(invite.id)
        await reload()
        Alert.alert('Odrzucono', 'Zaproszenie do zakładu zostało odrzucone.')
      } catch (e) {
        error('[useBetInvites] rejectBetInvite', e)
        Alert.alert('Błąd', 'Nie udało się odrzucić zaproszenia do zakładu.')
      }
    },
    [reload, userId],
  )

  return { betInvites, acceptBetInvite, rejectBetInvite }
}
