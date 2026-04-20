import { useCallback, useEffect, useState } from 'react'
import { AuthService } from '../services/auth.service'
import { BetsService } from '../services/bets.service'
import type { ProfileScreenData } from '../types/bet.types'

export function useProfile() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<ProfileScreenData | null>(null)

  const load = useCallback(async () => {
    const userId = await AuthService.getCurrentUserId()
    if (!userId) {
      setData(null)
      return
    }
    const row = await BetsService.getProfileScreenData(userId)
    setData(row)
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }, [load])

  return { loading, refreshing, data, onRefresh, reload: load }
}
