import { useCallback, useRef, useState } from 'react'
import { Alert } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthContext } from '@/features/auth'
import { queryKeys } from '@/shared/lib/queryKeys'
import {
  confirmPayment,
  getPairPendingPayments,
  rejectPayment,
  retractPayment,
  type PairPendingPayment,
} from '../api'

type ActionFn = (paymentId: string) => Promise<{ error?: string }>

/**
 * Wiszące spłaty między zalogowanym a znajomym + akcje na nich
 * (potwierdź / odrzuć — wierzyciel; wycofaj — autor wpisu). Po każdej udanej
 * akcji odświeża listę oraz cache salda (friendDetail / dashboard / profile).
 */
export function usePairPendingPayments(friendId: string) {
  const { userId } = useAuthContext()
  const queryClient = useQueryClient()
  const [busyId, setBusyId] = useState<string | null>(null)
  // Ref, nie tylko stan: `run` jest zamemoizowane, więc odczyt `busyId` z
  // domknięcia bywałby nieaktualny — dwa taps w tym samym ticku obu widziałyby
  // null. Ref blokuje drugie wywołanie synchronicznie (jak settlingRef w
  // useSettlePayment).
  const runningRef = useRef(false)

  const { data, refetch } = useQuery({
    queryKey: queryKeys.pairPendingPayments(userId ?? '', friendId),
    queryFn: () => getPairPendingPayments(userId!, friendId),
    enabled: !!userId && !!friendId,
  })

  useFocusEffect(
    useCallback(() => {
      if (userId && friendId) void refetch()
    }, [userId, friendId, refetch]),
  )

  const run = useCallback(
    async (fn: ActionFn, paymentId: string) => {
      if (runningRef.current) return
      runningRef.current = true
      setBusyId(paymentId)
      try {
        const result = await fn(paymentId)
        if (result.error) {
          Alert.alert('Błąd', result.error)
          return
        }
        await refetch()
        if (userId) {
          void queryClient.invalidateQueries({ queryKey: queryKeys.friendDetail(userId, friendId) })
          void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(userId) })
          void queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) })
        }
      } finally {
        runningRef.current = false
        setBusyId(null)
      }
    },
    [refetch, queryClient, userId, friendId],
  )

  const items: PairPendingPayment[] = data ?? []

  return {
    items,
    busyId,
    confirm: (paymentId: string) => run(confirmPayment, paymentId),
    reject: (paymentId: string) => run(rejectPayment, paymentId),
    retract: (paymentId: string) => run(retractPayment, paymentId),
  }
}
