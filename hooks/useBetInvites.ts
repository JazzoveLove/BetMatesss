import { Alert } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthContext } from '../contexts/AuthContext'
import { queryKeys } from '../lib/queryKeys'
import { BetsService } from '../services/bets.service'
import { NotificationsService, type BetInviteNotification } from '../services/notifications.service'
import { error } from '../utils/logger'

export function useBetInvites() {
  const { userId } = useAuthContext()
  const queryClient = useQueryClient()

  const { data: betInvites = [] } = useQuery({
    queryKey: queryKeys.betInvites(userId ?? ''),
    queryFn: () => NotificationsService.getPendingBetInviteNotifications(userId!),
    enabled: !!userId,
  })

  const acceptBetInvite = useMutation({
    mutationFn: async (invite: BetInviteNotification) => {
      const result = await BetsService.confirmParticipation(invite.betId, userId!)
      if (result.error) throw new Error(result.error)
      await NotificationsService.markNotificationRead(invite.id)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.betInvites(userId!) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(userId!) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.bets(userId!) })
      Alert.alert('Dołączono', 'Zaproszenie do zakładu zostało zaakceptowane.')
    },
    onError: (e) => {
      error('[useBetInvites] acceptBetInvite', e)
      Alert.alert('Błąd', e instanceof Error ? e.message : 'Nie udało się zaakceptować zaproszenia do zakładu.')
    },
  })

  const rejectBetInvite = useMutation({
    mutationFn: async (invite: BetInviteNotification) => {
      const result = await BetsService.rejectParticipation(invite.betId, userId!)
      if (result.error) throw new Error(result.error)
      await NotificationsService.markNotificationRead(invite.id)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.betInvites(userId!) })
      Alert.alert('Odrzucono', 'Zaproszenie do zakładu zostało odrzucone.')
    },
    onError: (e) => {
      error('[useBetInvites] rejectBetInvite', e)
      Alert.alert('Błąd', 'Nie udało się odrzucić zaproszenia do zakładu.')
    },
  })

  return {
    betInvites,
    // mutateAsync so callers receive Promise<void>; errors are handled by onError (Alert)
    acceptBetInvite: (invite: BetInviteNotification): Promise<void> =>
      acceptBetInvite.mutateAsync(invite).catch(() => undefined),
    rejectBetInvite: (invite: BetInviteNotification): Promise<void> =>
      rejectBetInvite.mutateAsync(invite).catch(() => undefined),
  }
}
