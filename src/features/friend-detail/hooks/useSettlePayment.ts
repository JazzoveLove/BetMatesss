import { useCallback, useState } from 'react'
import { Alert } from 'react-native'
import { useAuthContext } from '@/features/auth'
import { recordPayment } from '../api'

export function useSettlePayment(friendId: string, onSettled: () => void | Promise<void>) {
  const { userId } = useAuthContext()
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
        return true
      } finally {
        setSettling(false)
      }
    },
    [userId, friendId, onSettled],
  )

  return { settling, settle }
}