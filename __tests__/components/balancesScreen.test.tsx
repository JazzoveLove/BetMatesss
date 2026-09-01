import React from 'react'
import { render, screen } from '@testing-library/react-native'
import BalancesScreen from '@/features/balances/screens/balances'
import { useBalances } from '@/features/balances/hooks/useBalances'
import type { BalanceRow } from '@/features/balances/types/balance.types'

jest.mock('@/features/balances/hooks/useBalances', () => ({
  useBalances: jest.fn(),
}))

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}))

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native')
  return { SafeAreaView: ({ children }: { children: React.ReactNode }) => <View>{children}</View> }
})

// @expo/vector-icons' <Icon> robi asynchroniczny setState przy ładowaniu fontu,
// który po zakończeniu testu wpada w "not wrapped in act(...)" — a jest.setup.ts
// (failOnConsole) traktuje to jako błąd. Ikona nie ma znaczenia dla tych asercji.
jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native')
  return { Ionicons: ({ name }: { name: string }) => <Text>{`icon:${name}`}</Text> }
})

const mockUseBalances = useBalances as jest.Mock

type BalancesHook = ReturnType<typeof useBalances>

const BASE: BalancesHook = {
  loading: false,
  refreshing: false,
  isError: false,
  hasAnyRows: false,
  items: [],
  activeItems: [],
  inactiveItems: [],
  counts: { all: 0, positive: 0, negative: 0, zero: 0 },
  summary: { filter: 'all', totalCount: 0, netSum: 0 },
  friendCount: 0,
  filter: 'all',
  setFilter: jest.fn(),
  onRefresh: jest.fn(),
}

function mockState(overrides: Partial<BalancesHook>) {
  const next = { ...BASE, ...overrides }
  // Wygoda: gdy test podaje tylko `items`, wyprowadź sekcje po isFriend.
  if (overrides.items && !overrides.activeItems && !overrides.inactiveItems) {
    next.activeItems = overrides.items.filter(r => r.isFriend)
    next.inactiveItems = overrides.items.filter(r => !r.isFriend)
  }
  mockUseBalances.mockReturnValue(next)
}

function row(id: string, nick: string, balance: number, matchCount = 1, isFriend = true): BalanceRow {
  return { id, nick, avatarUrl: null, balance, matchCount, isFriend }
}

beforeEach(() => {
  mockUseBalances.mockReset()
})

describe('BalancesScreen — rozróżnienie stanów A / B / C', () => {
  it('STAN A (brak znajomych): NIE renderuje rzędu filtrów ani karty RAZEM', () => {
    mockState({ hasAnyRows: false })

    render(<BalancesScreen />)

    // To jest regres złapany manualnie: przy zero znajomych ani filtry,
    // ani podsumowanie nie mają się w ogóle pojawić.
    expect(screen.queryByTestId('balances-filter-bar')).toBeNull()
    expect(screen.queryByTestId('balances-summary-card')).toBeNull()
    expect(screen.getByText('Zacznij od znajomych')).toBeTruthy()
  })

  it('STAN B (są znajomi, wszystkie salda 0): karta RAZEM JEST renderowana, filtry NIE', () => {
    mockState({
      hasAnyRows: true,
      friendCount: 3,
      counts: { all: 3, positive: 0, negative: 0, zero: 3 },
      summary: { filter: 'all', totalCount: 3, netSum: 0 },
    })

    render(<BalancesScreen />)

    expect(screen.getByTestId('balances-summary-card')).toBeTruthy()
    expect(screen.queryByTestId('balances-filter-bar')).toBeNull()
    expect(screen.getByText('Wszystko rozliczone')).toBeTruthy()
    expect(screen.getByText('3 znajomych, zero otwartych rozliczeń.')).toBeTruthy()
  })

  it('STAN B z nieaktualnym filtrem "positive": karta nadal pokazuje RAZEM / Wszystko rozliczone', () => {
    // Ścieżka: STAN C → tap "Na plusie" → wejście w znajomego → Rozlicz → goBack
    // → useFocusEffect refetch → wszystkie salda 0. filter (useState) przeżył,
    // więc summary.filter === 'positive'. Karta nie może pokazać
    // "RAZEM NA PLUSIE / Brak wyników dla tego filtra".
    mockState({
      hasAnyRows: true,
      filter: 'positive',
      counts: { all: 3, positive: 0, negative: 0, zero: 3 },
      summary: { filter: 'positive', totalCount: 3, filteredCount: 0, sum: 0 },
    })

    render(<BalancesScreen />)

    expect(screen.getByText('Wszystko rozliczone')).toBeTruthy()
    expect(screen.queryByText('Brak wyników dla tego filtra')).toBeNull()
    expect(screen.queryByText('RAZEM NA PLUSIE')).toBeNull()
  })

  it('STAN B z jednym znajomym: pluralize daje "1 znajomy"', () => {
    mockState({
      hasAnyRows: true,
      friendCount: 1,
      counts: { all: 1, positive: 0, negative: 0, zero: 1 },
      summary: { filter: 'all', totalCount: 1, netSum: 0 },
    })

    render(<BalancesScreen />)

    expect(screen.getByText('1 znajomy, zero otwartych rozliczeń.')).toBeTruthy()
  })

  it('STAN C (są niezerowe salda): filtry ORAZ karta RAZEM są renderowane, liczniki bez nawiasów', () => {
    mockState({
      hasAnyRows: true,
      counts: { all: 2, positive: 1, negative: 1, zero: 0 },
      summary: { filter: 'all', totalCount: 2, netSum: 37 },
      items: [row('1', 'Ola', 47, 3), row('2', 'Kuba', -10, 1)],
    })

    render(<BalancesScreen />)

    expect(screen.getByTestId('balances-filter-bar')).toBeTruthy()
    expect(screen.getByTestId('balances-summary-card')).toBeTruthy()
    expect(screen.getByText('Wszyscy 2')).toBeTruthy()
    expect(screen.queryByText('Wszyscy (2)')).toBeNull()
  })
})

describe('BalancesScreen — saldo w wierszu', () => {
  it('bilans === 0 renderuje "na zero", a NIE "0 j."', () => {
    mockState({
      hasAnyRows: true,
      counts: { all: 2, positive: 1, negative: 0, zero: 1 },
      summary: { filter: 'all', totalCount: 2, netSum: 20 },
      items: [row('1', 'Ola', 20, 2), row('2', 'Kuba', 0, 4)],
    })

    render(<BalancesScreen />)

    expect(screen.getByText('na zero')).toBeTruthy()
    expect(screen.queryByText('0 j.')).toBeNull()
  })

  it('ujemne saldo w wierszu używa znaku MINUS (U+2212), nie ASCII-owego dywizu', () => {
    mockState({
      hasAnyRows: true,
      counts: { all: 2, positive: 0, negative: 2, zero: 0 },
      // netSum celowo inny niż którykolwiek pojedynczy wiersz, żeby test
      // nie łapał ASCII-owego "-" z karty podsumowania (formatBalance zostaje
      // nietknięte i tam nadal jest zwykły dywiz).
      summary: { filter: 'all', totalCount: 2, netSum: -13 },
      items: [row('1', 'Kuba', -10, 1), row('2', 'Ala', -3, 2)],
    })

    render(<BalancesScreen />)

    expect(screen.getByText('−10 j.')).toBeTruthy()
    expect(screen.queryByText('-10 j.')).toBeNull()
  })
})

describe('BalancesScreen — sekcja "Nieaktywni"', () => {
  it('nie renderuje się, gdy nie ma osób spoza listy znajomych', () => {
    mockState({
      hasAnyRows: true,
      counts: { all: 2, positive: 1, negative: 1, zero: 0 },
      summary: { filter: 'all', totalCount: 2, netSum: 37 },
      items: [row('1', 'Ola', 47, 3), row('2', 'Kuba', -10, 1)],
    })

    render(<BalancesScreen />)

    expect(screen.queryByTestId('balances-inactive-header')).toBeNull()
    expect(screen.queryByText('Nieaktywni')).toBeNull()
  })

  it('renderuje się z wierszem, gdy jest saldo z osobą spoza listy znajomych', () => {
    mockState({
      hasAnyRows: true,
      counts: { all: 2, positive: 1, negative: 1, zero: 0 },
      summary: { filter: 'all', totalCount: 2, netSum: 37 },
      items: [row('1', 'Ola', 47, 3, true), row('x', 'Usunięty użytkownik', -10, 1, false)],
    })

    render(<BalancesScreen />)

    expect(screen.getByTestId('balances-inactive-header')).toBeTruthy()
    expect(screen.getByText('Usunięty użytkownik')).toBeTruthy()
    expect(screen.getByText('−10 j.')).toBeTruthy()
  })

  it('liczniki w chipach filtrów uwzględniają sekcję Nieaktywni', () => {
    // 1 znajomy na plusie + 1 nieaktywny na minusie → chip "Na minusie" = 1,
    // nieklikalny byłby tylko przy 0.
    mockState({
      hasAnyRows: true,
      counts: { all: 2, positive: 1, negative: 1, zero: 0 },
      summary: { filter: 'all', totalCount: 2, netSum: 37 },
      items: [row('1', 'Ola', 47, 3, true), row('x', 'Usunięty użytkownik', -10, 1, false)],
    })

    render(<BalancesScreen />)

    expect(screen.getByText('Wszyscy 2')).toBeTruthy()
    expect(screen.getByText('Na minusie 1')).toBeTruthy()
  })
})

describe('BalancesScreen — stan ładowania i błędu', () => {
  it('ładowanie: skeleton zamiast filtrów i karty', () => {
    mockState({ loading: true })

    render(<BalancesScreen />)

    expect(screen.getByTestId('balances-skeleton')).toBeTruthy()
    expect(screen.queryByTestId('balances-filter-bar')).toBeNull()
    expect(screen.queryByTestId('balances-summary-card')).toBeNull()
  })

  it('błąd: komunikat i przycisk "Spróbuj ponownie"', () => {
    mockState({ isError: true })

    render(<BalancesScreen />)

    expect(screen.getByText('Spróbuj ponownie')).toBeTruthy()
    expect(screen.queryByTestId('balances-summary-card')).toBeNull()
  })
})
