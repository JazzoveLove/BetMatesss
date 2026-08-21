import { useCallback, useRef, useState } from 'react'
import { Alert } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthContext } from '@/features/auth'
import { queryKeys } from '@/shared/lib/queryKeys'
import { recordPayment } from '../api'

export function useSettlePayment(friendId: string, onSettled: () => void | Promise<void>) {
  const { userId } = useAuthContext()
  const queryClient = useQueryClient()
  const [settling, setSettling] = useState(false)
  // Ref, nie tylko stan: `settle` jest zamemoizowane przez useCallback bez
  // `settling` w deps, więc odczyt stanu w domknięciu byłby zawsze
  // nieaktualny (stale closure). Ref jest zawsze aktualny w momencie
  // wywołania, więc synchronicznie blokuje drugie kliknięcie zanim pierwsze
  // zdąży się zakończyć.
  const settlingRef = useRef(false)

  const settle = useCallback(
    async (amount: number, balance: number): Promise<boolean> => {
      if (!userId) return false
      if (settlingRef.current) return false
      if (amount <= 0) {
        Alert.alert('Błędna kwota', 'Podaj kwotę większą od zera.')
        return false
      }

      const [fromUser, toUser] = balance > 0 ? [friendId, userId] : [userId, friendId]

      settlingRef.current = true
      setSettling(true)
      try {
        const result = await recordPayment(fromUser, toUser, amount, userId)
        if (result.error) {
          Alert.alert('Błąd', result.error)
          return false
        }
        await onSettled()
        void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(userId) })
        void queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) })
        return true
      } finally {
        settlingRef.current = false
        setSettling(false)
      }
    },
    [userId, friendId, onSettled, queryClient],
  )

  return { settling, settle }
}