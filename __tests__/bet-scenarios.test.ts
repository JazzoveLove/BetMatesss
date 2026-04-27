/**
 * Testy scenariuszowe zakładów.
 *
 * Testujemy dwie czyste funkcje które razem odpowiadają za całą logikę finansową:
 *   buildParticipantRows  — kto ile stawia i jakie ma kursy
 *   buildSettlementRows   — kto komu ile płaci po zakończeniu zakładu
 */

// buildParticipantRows i buildSettlementRows są czystymi funkcjami, ale ich pliki
// importują klienta Supabase na poziomie modułu. Mockujemy go żeby testy
// nie wymagały zmiennych środowiskowych.
jest.mock('../lib/supabase', () => ({ supabase: {} }))
jest.mock('../services/friends.service', () => ({}))

import { buildParticipantRows } from '../services/bets/bets.create'
import { buildSettlementRows } from '../services/settlements.service'

// ─── Pomocniki ────────────────────────────────────────────────────────────────

function player(id: string, nick: string, customStake = '') {
  return { id, nick, customStake }
}

// ─── 2 graczy ─────────────────────────────────────────────────────────────────

describe('Zakład 2 graczy — equal stake', () => {
  const participants = [player('A', 'Maciek'), player('B', 'Bartek')]
  const params = {
    creatorId: 'A',
    stakeMode: 'equal' as const,
    globalStake: 100,
    participants,
  }
  const rows = buildParticipantRows('bet-1', params)

  it('tworzy 2 wiersze uczestników', () => {
    expect(rows).toHaveLength(2)
  })

  it('twórca jest potwierdzony, uczestnik nie', () => {
    expect(rows.find(r => r.user_id === 'A')?.confirmed).toBe(true)
    expect(rows.find(r => r.user_id === 'B')?.confirmed).toBe(false)
  })

  it('twórca ma rolę creator, uczestnik participant', () => {
    expect(rows.find(r => r.user_id === 'A')?.role).toBe('creator')
    expect(rows.find(r => r.user_id === 'B')?.role).toBe('participant')
  })

  it('każdy stawia 100 zł', () => {
    expect(rows.every(r => r.stake_amount === 100)).toBe(true)
  })

  it('kurs 2.0 — zwycięzca dostaje 2× stawkę', () => {
    expect(rows.every(r => r.odds === 2)).toBe(true)
  })

  describe('Rozliczenie: Maciek wygrywa', () => {
    const settlements = buildSettlementRows('bet-1', rows, 'A')

    it('tworzy 1 rozliczenie', () => {
      expect(settlements).toHaveLength(1)
    })

    it('Bartek jest dłużnikiem', () => {
      expect(settlements[0].debtor_id).toBe('B')
    })

    it('Maciek jest wierzycielem', () => {
      expect(settlements[0].creditor_id).toBe('A')
    })

    it('kwota długu to 100 zł (stawka Bartka)', () => {
      expect(settlements[0].amount).toBe(100)
    })
  })

  describe('Rozliczenie: Bartek wygrywa', () => {
    const settlements = buildSettlementRows('bet-1', rows, 'B')

    it('Maciek jest dłużnikiem', () => {
      expect(settlements[0].debtor_id).toBe('A')
    })

    it('kwota długu to 100 zł', () => {
      expect(settlements[0].amount).toBe(100)
    })
  })
})

// ─── 2 graczy — asymetryczne stawki (custom) ─────────────────────────────────

describe('Zakład 2 graczy — custom stake (różne stawki)', () => {
  const participants = [
    player('A', 'Maciek', '25'),
    player('B', 'Bartek', '75'),
  ]
  const params = {
    creatorId: 'A',
    stakeMode: 'custom' as const,
    globalStake: 0,
    participants,
  }
  const rows = buildParticipantRows('bet-2', params)

  it('Maciek stawia 25 zł', () => {
    expect(rows.find(r => r.user_id === 'A')?.stake_amount).toBe(25)
  })

  it('Bartek stawia 75 zł', () => {
    expect(rows.find(r => r.user_id === 'B')?.stake_amount).toBe(75)
  })

  it('Maciek ma kurs 4.0 — przy wygranej dostaje 4× swoje 25 zł', () => {
    expect(rows.find(r => r.user_id === 'A')?.odds).toBe(4)
  })

  it('Bartek ma kurs 1.33 — przy wygranej dostaje 1.33× swoje 75 zł', () => {
    expect(rows.find(r => r.user_id === 'B')?.odds).toBe(1.33)
  })

  describe('Rozliczenie: Maciek wygrywa (favoryt przegrywa)', () => {
    const settlements = buildSettlementRows('bet-2', rows, 'A')

    it('Bartek płaci Maćkowi 75 zł (swoje całe ryzyko)', () => {
      expect(settlements[0].debtor_id).toBe('B')
      expect(settlements[0].creditor_id).toBe('A')
      expect(settlements[0].amount).toBe(75)
    })
  })

  describe('Rozliczenie: Bartek wygrywa (favoryt wygrywa)', () => {
    const settlements = buildSettlementRows('bet-2', rows, 'B')

    it('Maciek płaci Bartkowi 25 zł (swoje całe ryzyko)', () => {
      expect(settlements[0].debtor_id).toBe('A')
      expect(settlements[0].creditor_id).toBe('B')
      expect(settlements[0].amount).toBe(25)
    })
  })
})

// ─── 2 graczy — zakład bez stawki ─────────────────────────────────────────────

describe('Zakład 2 graczy — bez stawki (stake_mode: none)', () => {
  const participants = [player('A', 'Maciek'), player('B', 'Bartek')]
  const rows = buildParticipantRows('bet-3', {
    creatorId: 'A',
    stakeMode: 'none',
    globalStake: 0,
    participants,
  })

  it('obie stawki to 0', () => {
    expect(rows.every(r => r.stake_amount === 0)).toBe(true)
  })

  it('kursy to 0', () => {
    expect(rows.every(r => r.odds === 0)).toBe(true)
  })

  it('nie tworzy rozliczeń — nie ma co płacić', () => {
    const settlements = buildSettlementRows('bet-3', rows, 'A')
    expect(settlements).toHaveLength(0)
  })
})

// ─── Formaty — metadane ────────────────────────────────────────────────────────

describe('Formaty zakładu — stawki i kursy są niezależne od formatu', () => {
  const participants = [player('A', 'Maciek'), player('B', 'Bartek')]
  const baseParams = { creatorId: 'A', stakeMode: 'equal' as const, globalStake: 50, participants }

  const formats = ['single', 'best_of', 'per_match', 'round_robin', 'elimination', 'session'] as const

  it.each(formats)('format %s → stawki i kursy poprawne', (format) => {
    // format nie jest parametrem buildParticipantRows — zapisywany jest na obiekcie bet
    // tutaj weryfikujemy że logika finansowa działa tak samo dla każdego formatu
    const rows = buildParticipantRows(`bet-${format}`, baseParams)
    expect(rows).toHaveLength(2)
    expect(rows.every(r => r.stake_amount === 50)).toBe(true)
    expect(rows.every(r => r.odds === 2)).toBe(true)
  })
})

// ─── 5 graczy ─────────────────────────────────────────────────────────────────

describe('Zakład 5 graczy — equal stake (turniej grupowy)', () => {
  const participants = [
    player('A', 'Maciek'),
    player('B', 'Bartek'),
    player('C', 'Kasia'),
    player('D', 'Piotr'),
    player('E', 'Ola'),
  ]
  const rows = buildParticipantRows('bet-5', {
    creatorId: 'A',
    stakeMode: 'equal',
    globalStake: 50,
    participants,
  })

  it('tworzy 5 wierszy', () => {
    expect(rows).toHaveLength(5)
  })

  it('każdy stawia 50 zł', () => {
    expect(rows.every(r => r.stake_amount === 50)).toBe(true)
  })

  it('kurs 5.0 — zwycięzca dostaje 5× stawkę (250 zł przy stawce 50)', () => {
    expect(rows.every(r => r.odds === 5)).toBe(true)
  })

  it('tylko twórca jest potwierdzony od razu', () => {
    expect(rows.filter(r => r.confirmed)).toHaveLength(1)
    expect(rows.find(r => r.confirmed)?.user_id).toBe('A')
  })

  describe('Rozliczenie: Kasia wygrywa', () => {
    const settlements = buildSettlementRows('bet-5', rows, 'C')

    it('tworzy 4 rozliczenia (jeden na każdego przegranego)', () => {
      expect(settlements).toHaveLength(4)
    })

    it('wszyscy przegrani płacą Kasi', () => {
      expect(settlements.every(s => s.creditor_id === 'C')).toBe(true)
    })

    it('zwycięzca nie jest wśród dłużników', () => {
      expect(settlements.some(s => s.debtor_id === 'C')).toBe(false)
    })

    it('każdy przegrany płaci 50 zł', () => {
      expect(settlements.every(s => s.amount === 50)).toBe(true)
    })

    it('łączna wypłata dla Kasi: 200 zł (4 × 50)', () => {
      const total = settlements.reduce((sum, s) => sum + s.amount, 0)
      expect(total).toBe(200)
    })
  })
})

// ─── 5 graczy — custom stake ──────────────────────────────────────────────────

describe('Zakład 5 graczy — custom stake (każdy stawia inaczej)', () => {
  const participants = [
    player('A', 'Maciek', '100'),
    player('B', 'Bartek', '50'),
    player('C', 'Kasia', '25'),
    player('D', 'Piotr', '75'),
    player('E', 'Ola', '150'),
  ]
  const rows = buildParticipantRows('bet-6', {
    creatorId: 'A',
    stakeMode: 'custom',
    globalStake: 0,
    participants,
  })
  // Łączna pula: 100 + 50 + 25 + 75 + 150 = 400 zł

  it('stawki są zgodne z customStake', () => {
    expect(rows.find(r => r.user_id === 'A')?.stake_amount).toBe(100)
    expect(rows.find(r => r.user_id === 'B')?.stake_amount).toBe(50)
    expect(rows.find(r => r.user_id === 'C')?.stake_amount).toBe(25)
    expect(rows.find(r => r.user_id === 'D')?.stake_amount).toBe(75)
    expect(rows.find(r => r.user_id === 'E')?.stake_amount).toBe(150)
  })

  it('Ola (150 zł) ma najniższy kurs — jest faworytem', () => {
    const olaOdds = rows.find(r => r.user_id === 'E')?.odds ?? 0
    const kasiaOdds = rows.find(r => r.user_id === 'C')?.odds ?? 0
    expect(olaOdds).toBeLessThan(kasiaOdds)
  })

  it('Kasia (25 zł) ma najwyższy kurs — jest autsajderem', () => {
    const kasiaOdds = rows.find(r => r.user_id === 'C')?.odds ?? 0
    expect(kasiaOdds).toBe(16) // 400 / 25 = 16
  })

  describe('Rozliczenie: Maciek wygrywa', () => {
    const settlements = buildSettlementRows('bet-6', rows, 'A')

    it('tworzy 4 rozliczenia', () => {
      expect(settlements).toHaveLength(4)
    })

    it('każdy płaci swoją stawkę', () => {
      expect(settlements.find(s => s.debtor_id === 'B')?.amount).toBe(50)
      expect(settlements.find(s => s.debtor_id === 'C')?.amount).toBe(25)
      expect(settlements.find(s => s.debtor_id === 'D')?.amount).toBe(75)
      expect(settlements.find(s => s.debtor_id === 'E')?.amount).toBe(150)
    })

    it('Maciek dostaje łącznie 300 zł (wszystkie stawki przegranych)', () => {
      const total = settlements.reduce((sum, s) => sum + s.amount, 0)
      expect(total).toBe(300)
    })
  })
})

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('Edge cases', () => {
  it('uczestnik ze stawką 0 nie generuje rozliczenia', () => {
    const participants = [
      { user_id: 'A', stake_amount: 100 },
      { user_id: 'B', stake_amount: 0 },
    ]
    const settlements = buildSettlementRows('bet-edge', participants, 'A')
    expect(settlements).toHaveLength(0)
  })

  it('gdy zwycięzca to jedyny uczestnik — brak rozliczeń', () => {
    const participants = [{ user_id: 'A', stake_amount: 100 }]
    const settlements = buildSettlementRows('bet-edge', participants, 'A')
    expect(settlements).toHaveLength(0)
  })

  it('rozliczenie ma prawidłowe bet_id', () => {
    const participants = [
      { user_id: 'A', stake_amount: 50 },
      { user_id: 'B', stake_amount: 50 },
    ]
    const settlements = buildSettlementRows('moj-zaklad-123', participants, 'A')
    expect(settlements[0].bet_id).toBe('moj-zaklad-123')
    expect(settlements[0].paid).toBe(false)
  })
})
