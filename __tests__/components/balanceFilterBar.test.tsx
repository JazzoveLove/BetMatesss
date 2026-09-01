import { StyleSheet } from 'react-native'
import { render, screen } from '@testing-library/react-native'
import { BalanceFilterBar } from '@/features/balances/components/BalanceFilterBar'
import { styles as balancesScreenStyles } from '@/features/balances/screens/styles/balances.styles'
import type { BalanceCounts } from '@/features/balances/types/balance.types'

const counts: BalanceCounts = { all: 4, positive: 2, negative: 1, zero: 1 }

describe('BalanceFilterBar — chipy nie rozlewają się na wysokość ekranu (regres z ef887b1)', () => {
  it('contentContainerStyle wymusza alignItems: "flex-start" — chipy trzymają naturalną wysokość', () => {
    render(<BalanceFilterBar filter="all" onFilterChange={jest.fn()} counts={counts} />)

    const bar = screen.getByTestId('balances-filter-bar')
    expect(StyleSheet.flatten(bar.props.contentContainerStyle)).toMatchObject({
      alignItems: 'flex-start',
    })
  })

  it('pasek ma flexGrow: 0 — nie może się rozciągnąć w pionie w kolumnie rodzica', () => {
    render(<BalanceFilterBar filter="all" onFilterChange={jest.fn()} counts={counts} />)

    const bar = screen.getByTestId('balances-filter-bar')
    expect(StyleSheet.flatten(bar.props.style)).toMatchObject({ flexGrow: 0 })
  })
})

describe('styl kontenera ekranu Bilanse — brak flexGrow (root cause)', () => {
  it('content nie ma flexGrow: 1 — inaczej zagnieżdżony poziomy ScrollView filtrów puchnie', () => {
    const content = StyleSheet.flatten(balancesScreenStyles.content) as Record<string, unknown>
    expect('flexGrow' in content).toBe(false)
  })
})
