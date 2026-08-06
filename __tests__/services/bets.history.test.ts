import { historyBadgeAndAmount } from '@/features/bets/api/bets.history'

describe('historyBadgeAndAmount', () => {
  it('status "pending" → badge "oczekuje", kwota "—"', () => {
    // Arrange
    // Act
    const result = historyBadgeAndAmount({ status: 'pending' }, 0, false)

    // Assert
    expect(result).toEqual({ badge: 'oczekuje', amountLabel: '—' })
  })

  it('status "rejected" → badge "odrzucony"', () => {
    // Arrange
    // Act
    const result = historyBadgeAndAmount({ status: 'rejected' }, 0, false)

    // Assert
    expect(result.badge).toBe('odrzucony')
  })

  it('status "disputed" → badge "spór"', () => {
    // Arrange
    // Act
    const result = historyBadgeAndAmount({ status: 'disputed' }, 0, false)

    // Assert
    expect(result.badge).toBe('spór')
  })

  it('status "active" → badge "aktywny"', () => {
    // Arrange
    // Act
    const result = historyBadgeAndAmount({ status: 'active' }, 0, false)

    // Assert
    expect(result.badge).toBe('aktywny')
  })

  it('status "awaiting_confirmation" → badge "aktywny"', () => {
    // Arrange
    // Act
    const result = historyBadgeAndAmount({ status: 'awaiting_confirmation' }, 0, false)

    // Assert
    expect(result.badge).toBe('aktywny')
  })

  it('status "completed" z profit > 0 → badge "wygrany" i kwota z plusem', () => {
    // Arrange
    // Act
    const result = historyBadgeAndAmount({ status: 'completed' }, 50, true)

    // Assert
    expect(result).toEqual({ badge: 'wygrany', amountLabel: '+50 zł' })
  })

  it('status "completed" z profit < 0 → badge "przegrany"', () => {
    // Arrange
    // Act
    const result = historyBadgeAndAmount({ status: 'completed' }, -50, true)

    // Assert
    expect(result).toEqual({ badge: 'przegrany', amountLabel: '-50 zł' })
  })

  it('status "completed" bez rozliczenia (zakład honorowy) → badge "zakończony", kwota "0 zł"', () => {
    // Arrange
    // Act
    const result = historyBadgeAndAmount({ status: 'completed' }, 0, false)

    // Assert
    expect(result).toEqual({ badge: 'zakończony', amountLabel: '0 zł' })
  })
})
