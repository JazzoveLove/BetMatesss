import { supabase } from '@/shared/lib/supabase'
import { DELETED_USER_NICK } from '@/shared/constants/user/deletedUser'
import type { BalanceRow } from '@/features/balances/types/balance.types'

/**
 * Kontrahent, którego wiersza w `users` nie da się odczytać (teoretyczne —
 * patrz komentarz w migracji get_balances_screen_data: `users` nie jest
 * kasowane, a can_see_user daje prawo odczytu). Wiersz z saldem MUSI się
 * pokazać mimo braku nicku — fail-open na profilu.
 */
const UNRESOLVED_NICK = 'Znajomy'

type BalancesScreenDataRow = {
  other_id: string
  nick: string | null
  avatar_url: string | null
  is_friend: boolean
  deleted_at: string | null
  balance: number | string
  match_count: number | string
}

/**
 * JEDNO wywołanie RPC. Baza zwraca już kompletny, połączony zbiór: wszystkich,
 * z którymi łączy Cię znajomość, saldo albo wspólne mecze (UNION trzech źródeł
 * w SQL). Żadnego łączenia list po stronie JS — to właśnie ono gubiło salda z
 * usuniętymi kontami (BŁĄD-1 / KROK 2.5a), bo pętla startowała od listy
 * znajomych. JS tylko mapuje wiersz RPC na BalanceRow.
 *
 * Fail-closed: błąd RPC leci wyżej (hook → isError), pusta lista udawałaby
 * "brak zobowiązań". Nick: deleted_at → "Usunięty użytkownik"; brak wiersza w
 * users (teoretyczny) → etykieta zastępcza, ale wiersz zostaje.
 */
export async function getBalancesScreenData(userId: string): Promise<BalanceRow[]> {
  const { data, error } = await supabase.rpc('get_balances_screen_data', { p_viewer: userId })
  if (error) throw error

  return ((data ?? []) as BalancesScreenDataRow[]).map(row => ({
    id: row.other_id,
    nick: row.deleted_at ? DELETED_USER_NICK : row.nick ?? UNRESOLVED_NICK,
    avatarUrl: row.avatar_url ?? null,
    balance: Number(row.balance),
    matchCount: Number(row.match_count),
    isFriend: row.is_friend,
  }))
}
