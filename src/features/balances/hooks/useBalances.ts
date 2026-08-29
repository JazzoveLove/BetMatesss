import { useCallback, useMemo, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { useAuthContext } from '@/features/auth'
import { queryKeys } from '@/shared/lib/queryKeys'
import { getBalancesScreenData } from '@/features/balances/api/balances.queries'
import { getBalanceCounts, getBalanceSummary, getVisibleBalances } from '@/features/balances/utils/balanceLogic'
import type { BalanceFilter } from '@/features/balances/types/balance.types'

export function useBalances() {
  const { userId } = useAuthContext()
  const [filter, setFilter] = useState<BalanceFilter>('all')

  const { data, isLoading, isRefetching, isError, refetch } = useQuery({
    queryKey: queryKeys.balances(userId ?? ''),
    queryFn: () => getBalancesScreenData(userId!),
    enabled: !!userId,
  })

  useFocusEffect(
    useCallback(() => {
      if (userId) void refetch()
    }, [userId, refetch]),
  )

  const allRows = data ?? []

  // items = pełna lista (znajomi + Nieaktywni) po filtrze i sortowaniu.
  // Sekcje w UI powstają przez podział tej listy po isFriend — dzięki temu
  // sortowanie i filtr działają spójnie na obu sekcjach naraz.
  const items = useMemo(() => getVisibleBalances(allRows, filter), [allRows, filter])
  const activeItems = useMemo(() => items.filter(r => r.isFriend), [items])
  const inactiveItems = useMemo(() => items.filter(r => !r.isFriend), [items])

  // Liczniki chipów liczą się z pełnej listy — filtr "Na plusie" itd. ma
  // obejmować również sekcję Nieaktywni (BŁĄD-1, wymóg z KROK 2.5a).
  const counts = useMemo(() => getBalanceCounts(allRows), [allRows])
  const summary = useMemo(() => getBalanceSummary(allRows, filter), [allRows, filter])

  // Tylko aktywni znajomi — do copy "{N} znajomych" w stanie "wszystko
  // rozliczone". Liczone z allRows (nie z items), żeby nie zależało od filtra.
  const friendCount = useMemo(() => allRows.filter(r => r.isFriend).length, [allRows])

  return {
    loading: isLoading,
    refreshing: isRefetching,
    // Surowy stan błędu z react-query — ekran pokazuje "Spróbuj ponownie".
    // To nie jest zmiana logiki API, tylko przekazanie istniejącego stanu useQuery.
    isError,
    // "czy w ogóle jest co pokazać" — znajomi ALBO salda z osobami spoza listy
    // znajomych. Wcześniej nazwane hasAnyFriends, ale po BŁĄD-1 liczą się też
    // Nieaktywni: użytkownik bez znajomych, ale z długiem po usuniętym koncie
    // NIE jest w stanie pustym.
    hasAnyRows: allRows.length > 0,
    items,
    activeItems,
    inactiveItems,
    counts,
    summary,
    friendCount,
    filter,
    setFilter,
    onRefresh: refetch,
  }
}
