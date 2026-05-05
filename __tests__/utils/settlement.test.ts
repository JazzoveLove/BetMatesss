import { calculateActiveBalance, calculateSettlements, confirmPayment, markAsPaid, rejectPayment, settlementDraftsFromPairBalances, type SettlementHandshake } from '../../utils/settlements'

describe('calculateSettlements', () => {
  it('should return correct settlement when winner takes all with equal stakes', () => {
    // Arrange
    const participants = [
      { id: 'u1', stakeAmount: 50 },
      { id: 'u2', stakeAmount: 50 },
      { id: 'u3', stakeAmount: 50 },
    ]

    // Act
    const result = calculateSettlements(participants, 'u1', 'equal')

    // Assert
    expect(result).toEqual([
      { debtorId: 'u2', creditorId: 'u1', amount: 50 },
      { debtorId: 'u3', creditorId: 'u1', amount: 50 },
    ])
  })

  it('should return per-participant settlement amounts for custom stakes', () => {
    // Arrange
    const participants = [
      { id: 'u1', stakeAmount: 100 },
      { id: 'u2', stakeAmount: 25 },
      { id: 'u3', stakeAmount: 75 },
    ]

    // Act
    const result = calculateSettlements(participants, 'u1', 'custom')

    // Assert
    expect(result).toEqual([
      { debtorId: 'u2', creditorId: 'u1', amount: 25 },
      { debtorId: 'u3', creditorId: 'u1', amount: 75 },
    ])
  })

  it('should return empty array when stake mode is none', () => {
    // Arrange
    const participants = [
      { id: 'u1', stakeAmount: 30 },
      { id: 'u2', stakeAmount: 30 },
    ]

    // Act
    const result = calculateSettlements(participants, 'u1', 'none')

    // Assert
    expect(result).toEqual([])
  })

  it('should return empty array when winner is missing from participants', () => {
    // Arrange
    const participants = [
      { id: 'u1', stakeAmount: 30 },
      { id: 'u2', stakeAmount: 30 },
    ]

    // Act
    const result = calculateSettlements(participants, 'uX', 'equal')

    // Assert
    expect(result).toEqual([])
  })

  it('should skip participants with zero or negative stakes', () => {
    // Arrange
    const participants = [
      { id: 'u1', stakeAmount: 20 },
      { id: 'u2', stakeAmount: 0 },
      { id: 'u3', stakeAmount: -5 },
    ]

    // Act
    const result = calculateSettlements(participants, 'u1', 'custom')

    // Assert
    expect(result).toEqual([])
  })
})

describe('settlementDraftsFromPairBalances', () => {
  it('should create single transfer from loser to winner for positive balance', () => {
    // Arrange
    const balances = { a: 40, b: -40 }

    // Act
    const drafts = settlementDraftsFromPairBalances(balances, ['a', 'b'])

    // Assert
    expect(drafts).toEqual([{ debtorId: 'b', creditorId: 'a', amount: 40 }])
  })

  it('should create single transfer from first user when first balance is negative', () => {
    // Arrange
    const balances = { a: -15, b: 15 }

    // Act
    const drafts = settlementDraftsFromPairBalances(balances, ['a', 'b'])

    // Assert
    expect(drafts).toEqual([{ debtorId: 'a', creditorId: 'b', amount: 15 }])
  })

  it('should return empty array for zero balance', () => {
    // Arrange
    const balances = { a: 0, b: 0 }

    // Act
    const drafts = settlementDraftsFromPairBalances(balances, ['a', 'b'])

    // Assert
    expect(drafts).toEqual([])
  })

  it('should return empty array when participant count is not exactly two', () => {
    // Arrange
    const balances = { a: 20, b: -20, c: 0 }

    // Act
    const drafts = settlementDraftsFromPairBalances(balances, ['a', 'b', 'c'])

    // Assert
    expect(drafts).toEqual([])
  })

  it('should treat missing user balance as zero', () => {
    // Arrange
    const balances = { a: 10 }

    // Act
    const drafts = settlementDraftsFromPairBalances(balances, ['a', 'b'])

    // Assert
    expect(drafts).toEqual([{ debtorId: 'b', creditorId: 'a', amount: 10 }])
  })
})

describe('payment handshake transitions', () => {
  const baseSettlement: SettlementHandshake = {
    id: 's1',
    debtorId: 'u2',
    creditorId: 'u1',
    amount: 20,
    paymentStatus: 'unpaid',
  }

  it('markAsPaid should change status to pending_confirmation', () => {
    const result = markAsPaid(baseSettlement, 'u2')
    expect(result.paymentStatus).toBe('pending_confirmation')
  })

  it('confirmPayment should change status to paid only for creditor', () => {
    const pending = { ...baseSettlement, paymentStatus: 'pending_confirmation' as const }
    const result = confirmPayment(pending, 'u1')
    expect(result.paymentStatus).toBe('paid')
  })

  it('rejectPayment should change status to disputed', () => {
    const pending = { ...baseSettlement, paymentStatus: 'pending_confirmation' as const }
    const result = rejectPayment(pending, 'u1')
    expect(result.paymentStatus).toBe('disputed')
  })

  it('debtor should not be able to call confirmPayment', () => {
    const pending = { ...baseSettlement, paymentStatus: 'pending_confirmation' as const }
    expect(() => confirmPayment(pending, 'u2')).toThrow('Tylko wierzyciel może potwierdzić płatność')
  })

  it('profile balance should ignore settlements with paid status', () => {
    const settlements: SettlementHandshake[] = [
      { ...baseSettlement, id: 's-unpaid', paymentStatus: 'unpaid' },
      { ...baseSettlement, id: 's-pending', paymentStatus: 'pending_confirmation' },
      { ...baseSettlement, id: 's-paid', paymentStatus: 'paid' },
    ]

    expect(calculateActiveBalance(settlements, 'u1')).toBe(40)
    expect(calculateActiveBalance(settlements, 'u2')).toBe(-40)
  })
})
