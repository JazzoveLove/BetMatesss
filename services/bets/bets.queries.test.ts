// bets.queries importuje supabase — mockujemy żeby testy nie wymagały .env
jest.mock('../../lib/supabase', () => ({ supabase: {} }))
jest.mock('../friends.service', () => ({}))

import { historyBadgeAndAmount } from './bets.queries'
import type { BetRow } from '../../types/bet.types'

const baseBet: BetRow = {
  id: '1',
  creator_id: 'user-1',
  game_template: 'football',
  format: 'single',
  stake_mode: 'equal',
  status: 'pending',
  created_at: '2024-01-01T00:00:00Z',
}

describe('historyBadgeAndAmount', () => {
  describe('zakłady w toku', () => {
    it('pending → oczekuje, brak kwoty', () => {
      expect(historyBadgeAndAmount({ ...baseBet, status: 'pending' }, 0, false)).toEqual({
        badge: 'oczekuje',
        amountLabel: '—',
      })
    })

    it('active → aktywny, brak kwoty', () => {
      expect(historyBadgeAndAmount({ ...baseBet, status: 'active' }, 0, false)).toEqual({
        badge: 'aktywny',
        amountLabel: '—',
      })
    })

    it('awaiting_confirmation → aktywny, brak kwoty', () => {
      expect(historyBadgeAndAmount({ ...baseBet, status: 'awaiting_confirmation' }, 100, false)).toEqual({
        badge: 'aktywny',
        amountLabel: '—',
      })
    })

    it('disputed → spór, brak kwoty', () => {
      expect(historyBadgeAndAmount({ ...baseBet, status: 'disputed' }, 0, false)).toEqual({
        badge: 'spór',
        amountLabel: '—',
      })
    })
  })

  describe('zakłady zakończone', () => {
    it('wygrany 50 zł → badge wygrany, +50 zł', () => {
      expect(historyBadgeAndAmount({ ...baseBet, status: 'completed' }, 50, true)).toEqual({
        badge: 'wygrany',
        amountLabel: '+50 zł',
      })
    })

    it('przegrany 30 zł → badge przegrany, -30 zł', () => {
      expect(historyBadgeAndAmount({ ...baseBet, status: 'completed' }, -30, true)).toEqual({
        badge: 'przegrany',
        amountLabel: '-30 zł',
      })
    })

    it('completed bez rozliczenia (stake_mode none) → zakończony, 0 zł', () => {
      expect(historyBadgeAndAmount({ ...baseBet, status: 'completed' }, 0, false)).toEqual({
        badge: 'zakończony',
        amountLabel: '0 zł',
      })
    })

    it('completed z rozliczeniem ale profit 0 → zakończony, 0 zł', () => {
      expect(historyBadgeAndAmount({ ...baseBet, status: 'completed' }, 0, true)).toEqual({
        badge: 'zakończony',
        amountLabel: '0 zł',
      })
    })
  })
})
