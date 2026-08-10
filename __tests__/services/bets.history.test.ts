import { historyBadgeAndAmount } from '@/features/bets/api/bets.history'

jest.mock('@/shared/lib/supabase', () => ({ supabase: {} }))
jest.mock('@/features/friends', () => ({}))

describe('historyBadgeAndAmount', () => {
  it('status "pending" → badge "oczekuje", kwota "—"', () => {
    const result = historyBadgeAndAmount({ status: 'pending' }, 0, false, null)

    expect(result).toEqual({ badge: 'oczekuje', amountLabel: '—' })
  })

  it('status "rejected" → badge "odrzucony"', () => {
    const result = historyBadgeAndAmount({ status: 'rejected' }, 0, false, null)

    expect(result.badge).toBe('odrzucony')
  })

  it('status "disputed" → badge "spór"', () => {
    const result = historyBadgeAndAmount({ status: 'disputed' }, 0, false, null)

    expect(result.badge).toBe('spór')
  })

  it('status "active" → badge "aktywny"', () => {
    const result = historyBadgeAndAmount({ status: 'active' }, 0, false, null)

    expect(result.badge).toBe('aktywny')
  })

  it('status "awaiting_confirmation" → badge "aktywny"', () => {
    const result = historyBadgeAndAmount({ status: 'awaiting_confirmation' }, 0, false, null)

    expect(result.badge).toBe('aktywny')
  })

  it('status "completed" z profit > 0 → badge "wygrany" i kwota z plusem', () => {
    const result = historyBadgeAndAmount({ status: 'completed' }, 50, true, null)

    expect(result).toEqual({ badge: 'wygrany', amountLabel: '+50 j.' })
  })

  it('status "completed" z profit < 0 → badge "przegrany"', () => {
    const result = historyBadgeAndAmount({ status: 'completed' }, -50, true, null)

    expect(result).toEqual({ badge: 'przegrany', amountLabel: '-50 j.' })
  })

  it('status "completed" bez rozliczenia (zakład honorowy) → badge "zakończony", kwota "0 zł"', () => {
    const result = historyBadgeAndAmount({ status: 'completed' }, 0, false, null)

    expect(result).toEqual({ badge: 'zakończony', amountLabel: '0 j.' })
  })
})
