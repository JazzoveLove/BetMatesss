import { resolveModalResult, parsePendingScore } from '../../components/bet-detail/BetScoreModal'

describe('resolveModalResult', () => {
  it('resultType "winner_only": zwraca wybranego zwycięzcę', () => {
    // Arrange
    // Act
    const result = resolveModalResult('winner_only', 'me-1', 'opp-1', '', '', 'opp-1')

    // Assert
    expect(result).toEqual({ winnerId: 'opp-1', score: 'winner_only' })
  })

  it('resultType "score": 11:7 → zwycięzcą jest gracz z wyższym wynikiem, score "11:7"', () => {
    // Arrange
    // Act
    const result = resolveModalResult('score', 'me-1', 'opp-1', '11', '7', null)

    // Assert
    expect(result).toEqual({ winnerId: 'me-1', score: '11:7' })
  })

  it('resultType "legs": działa tak samo jak "score" (regresja realnego buga — dart nie dawał się rozstrzygnąć)', () => {
    // Arrange
    // Act
    const result = resolveModalResult('legs', 'me-1', 'opp-1', '3', '1', null)

    // Assert
    expect(result).toEqual({ winnerId: 'me-1', score: '3:1' })
  })

  it('resultType "sets": działa tak samo jak "score" (regresja realnego buga — tenis nie dawał się rozstrzygnąć)', () => {
    // Arrange
    // Act
    const result = resolveModalResult('sets', 'me-1', 'opp-1', '1', '2', null)

    // Assert
    expect(result).toEqual({ winnerId: 'opp-1', score: '1:2' })
  })

  it('remis (równe wyniki) → winnerId null (brak rozstrzygnięcia)', () => {
    // Arrange
    // Act
    const result = resolveModalResult('score', 'me-1', 'opp-1', '5', '5', null)

    // Assert
    expect(result).toEqual({ winnerId: null, score: null })
  })

  it('niepełne dane (puste pole) → winnerId null', () => {
    // Arrange
    // Act
    const result = resolveModalResult('score', 'me-1', 'opp-1', '', '7', null)

    // Assert
    expect(result).toEqual({ winnerId: null, score: null })
  })
})

describe('parsePendingScore', () => {
  it('poprawnie rozbija "11:7" na myScore i opponentScore', () => {
    // Arrange
    // Act
    const result = parsePendingScore('11:7')

    // Assert
    expect(result).toEqual({ myScore: 11, opponentScore: 7 })
  })

  it('zwraca nulle dla pustego stringa', () => {
    // Arrange
    // Act
    const result = parsePendingScore('')

    // Assert
    expect(result).toEqual({ myScore: null, opponentScore: null })
  })
})
