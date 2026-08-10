import { historyBadgeAndAmount } from '@/features/bets/api/bets.history'
import type { BetRow } from '@/features/bets/types/bet.types'

jest.mock('@/shared/lib/supabase', () => ({ supabase: {} }))
jest.mock('@/features/friends', () => ({}))

const baseBet: BetRow = {
  id: '1',
  creator_id: 'user-1',
  game_template: 'football',
  format: 'single',
  stake_mode: 'equal',
  status: 'pending',
  created_at: '2024-01-01T00:00:00Z',
  rejected_at: null,
  stake_per_match: null,
}

describe('historyBadgeAndAmount', () => {
  describe('zakłady w toku', () => {
    it('pending → oczekuje, brak kwoty', () => {
      expect(historyBadgeAndAmount({ ...baseBet, status: 'pending' }, 0, false, null)).toEqual({
        badge: 'oczekuje',
        amountLabel: '—',
      })
    })

    it('active → aktywny, brak kwoty', () => {
      expect(historyBadgeAndAmount({ ...baseBet, status: 'active' }, 0, false, null)).toEqual({
        badge: 'aktywny',
        amountLabel: '—',
      })
    })

    it('awaiting_confirmation → aktywny, brak kwoty', () => {
      expect(historyBadgeAndAmount({ ...baseBet, status: 'awaiting_confirmation' }, 100, false, null)).toEqual({
        badge: 'aktywny',
        amountLabel: '—',
      })
    })

    it('disputed → spór, brak kwoty', () => {
      expect(historyBadgeAndAmount({ ...baseBet, status: 'disputed' }, 0, false, null)).toEqual({
        badge: 'spór',
        amountLabel: '—',
      })
    })
  })

  describe('zakłady zakończone', () => {
    it('wygrany 50 j. → badge wygrany, +50 j.', () => {
      expect(historyBadgeAndAmount({ ...baseBet, status: 'completed' }, 50, true, null)).toEqual({
        badge: 'wygrany',
        amountLabel: '+50 j.',
      })
    })

    it('przegrany 30 j. → badge przegrany, -30 j.', () => {
      expect(historyBadgeAndAmount({ ...baseBet, status: 'completed' }, -30, true, null)).toEqual({
        badge: 'przegrany',
        amountLabel: '-30 j.',
      })
    })

    it('completed bez rozliczenia (stake_mode none) → zakończony, 0 j.', () => {
      expect(historyBadgeAndAmount({ ...baseBet, status: 'completed' }, 0, false, null)).toEqual({
        badge: 'zakończony',
        amountLabel: '0 j.',
      })
    })

    it('completed z rozliczeniem ale profit 0 → zakończony, 0 j.', () => {
      expect(historyBadgeAndAmount({ ...baseBet, status: 'completed' }, 0, true, null)).toEqual({
        badge: 'zakończony',
        amountLabel: '0 j.',
      })
    })
  })
})
