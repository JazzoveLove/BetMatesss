import { useCallback, useState } from 'react'
import { Alert } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthContext } from '@/features/auth'
import { queryKeys } from '@/shared/lib/queryKeys'
import { recordPayment } from '../api'

export function useSettlePayment(friendId: string, onSettled: () => void | Promise<void>) {
  const { userId } = useAuthContext()
  const queryClient = useQueryClient()
  const [settling, setSettling] = useState(false)

  const settle = useCallback(
    async (amount: number, balance: number): Promise<boolean> => {
      if (!userId) return false
      if (amount <= 0) {
        Alert.alert('Błędna kwota', 'Podaj kwotę większą od zera.')
        return false
      }

      const [fromUser, toUser] = balance > 0 ? [friendId, userId] : [userId, friendId]

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
        setSettling(false)
      }
    },
    [userId, friendId, onSettled, queryClient],
  )

  return { settling, settle }
}