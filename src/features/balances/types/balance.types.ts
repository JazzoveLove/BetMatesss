export type BalanceFilter = 'all' | 'positive' | 'negative' | 'zero'

export type BalanceRow = {
  id: string
  nick: string
  avatarUrl: string | null
  balance: number
  matchCount: number
  /**
   * true  — aktywny znajomy (główna lista).
   * false — osoba spoza listy znajomych, z którą wciąż istnieje saldo lub
   *         wspólne mecze (usunięte konto / usunięcie ze znajomych). Trafia
   *         do sekcji "Nieaktywni". Patrz BŁĄD-1 w KROK 2.5a: wcześniej
   *         takie salda znikały z ekranu bez śladu.
   */
  isFriend: boolean
}

export type BalanceCounts = {
  all: number
  positive: number
  negative: number
  zero: number
}

export type BalanceSummary =
  | { filter: 'all'; totalCount: number; netSum: number }
  | { filter: 'positive'; totalCount: number; filteredCount: number; sum: number }
  | { filter: 'negative'; totalCount: number; filteredCount: number; sum: number }
  | { filter: 'zero'; totalCount: number; filteredCount: number }
