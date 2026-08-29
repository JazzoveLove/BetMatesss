import { supabase } from '@/shared/lib/supabase'
import { getAcceptedFriendsList, loadNicksByIds } from '@/features/friends'
import type { BalanceRow } from '@/features/balances/types/balance.types'

/**
 * Fallback dla osoby spoza listy znajomych, której profilu nie udało się
 * odczytać. `loadNicksByIds` zwraca `{}` zarówno przy błędzie zapytania, jak i
 * przy braku wiersza — z zewnątrz nie da się ich rozróżnić, więc fallback pada
 * tak samo w obu przypadkach. To celowe: brak nicku NIE może ukryć salda
 * (fail-open na profilu). `users.deleted_at` jest już odwzorowane wewnątrz
 * `loadNicksByIds` na "Usunięty użytkownik". W praktyce ten fallback jest
 * teoretyczny — wiersz w `users` nie jest kasowany przy usuwaniu konta (tylko
 * anonimizowany), a can_see_user daje prawo odczytu przez wspólny wiersz w
 * bet_participants, który też nie jest kasowany.
 */
const UNKNOWN_COUNTERPARTY_NICK = 'Znajomy'

export async function getBalancesScreenData(userId: string): Promise<BalanceRow[]> {
  const [friends, balancesRes, matchCountsRes] = await Promise.all([
    getAcceptedFriendsList(userId),
    supabase.rpc('get_balances_with_friends', { p_viewer: userId }),
    supabase.rpc('get_match_counts_with_friends', { p_viewer: userId }),
  ])
  // Fail-closed na saldach: błąd którejkolwiek z tych dwóch RPC leci wyżej.
  // Pusta lista udawałaby "brak zobowiązań", a to sprawy finansowe.
  if (balancesRes.error) throw balancesRes.error
  if (matchCountsRes.error) throw matchCountsRes.error

  const balanceById = new Map<string, number>(
    ((balancesRes.data ?? []) as { other_id: string; balance: number }[]).map(r => [r.other_id, Number(r.balance)]),
  )
  const matchCountById = new Map<string, number>(
    ((matchCountsRes.data ?? []) as { other_id: string; match_count: number }[]).map(r => [
      r.other_id,
      Number(r.match_count),
    ]),
  )

  const friendById = new Map(friends.map(f => [f.id, f]))

  // BŁĄD-1: iterowanie po samej liście znajomych gubiło salda z osobami, które
  // usunęły konto / zostały usunięte ze znajomych (wiersz friendships kasowany,
  // ale saldo w get_balances_with_friends nadal jest). Bierzemy więc UNIĘ id z
  // trzech źródeł: znajomi ∪ salda ∪ liczby meczów.
  const nonFriendIds = [...new Set([...balanceById.keys(), ...matchCountById.keys()])]
    .filter(id => !friendById.has(id))
    // Deterministyczna kolejność sekcji "Nieaktywni" — żadna z RPC nie ma
    // ORDER BY, więc kolejność wierszy z bazy jest nieokreślona i mogłaby się
    // zmieniać między odświeżeniami (przy remisach sald / meczów).
    .sort()

  const nickById = nonFriendIds.length > 0 ? await loadNicksByIds(nonFriendIds) : {}

  const orderedIds = [...friends.map(f => f.id), ...nonFriendIds]

  return orderedIds.map(id => {
    const friend = friendById.get(id)
    return {
      id,
      nick: friend ? friend.nick : nickById[id] ?? UNKNOWN_COUNTERPARTY_NICK,
      avatarUrl: friend ? friend.avatar_url ?? null : null,
      balance: balanceById.get(id) ?? 0,
      matchCount: matchCountById.get(id) ?? 0,
      isFriend: !!friend,
    }
  })
}
