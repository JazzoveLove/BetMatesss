jest.mock('@/shared/lib/supabase', () => {
  const { createSupabaseMock } = require('@/__tests__/helpers/supabaseMock')
  return createSupabaseMock()
})

import { itemMatchesFilter } from '../../hooks/useHistory'
import type { BetStatus, HistoryListItem } from '@/features/bets/types/bet.types'

const item: HistoryListItem = {
  id: 'bet-1',
  gameTemplate: 'pilkarzyki',
  createdAt: '2026-08-01T00:00:00.000Z',
  opponentNick: 'Rywal',
  badge: 'aktywny',
  amountLabel: '—',
  profit: 0,
}

function statusMap(status: BetStatus): Map<string, BetStatus> {
  return new Map([[item.id, status]])
}

const ACTIVE_STATUSES: BetStatus[] = ['pending', 'active', 'awaiting_confirmation']
const OTHER_STATUSES: BetStatus[] = ['rejected', 'disputed', 'completed']
const ALL_STATUSES: BetStatus[] = [...ACTIVE_STATUSES, ...OTHER_STATUSES]

describe('itemMatchesFilter', () => {
  it('filtr "active" zwraca true tylko dla pending, active i awaiting_confirmation', () => {
    // Arrange
    // Act & Assert
    for (const status of ACTIVE_STATUSES) {
      expect(itemMatchesFilter(item, 'active', statusMap(status))).toBe(true)
    }
  })

  it('filtr "active" zwraca false dla rejected i disputed (regresja realnego buga)', () => {
    // Arrange
    // Act & Assert
    expect(itemMatchesFilter(item, 'active', statusMap('rejected'))).toBe(false)
    expect(itemMatchesFilter(item, 'active', statusMap('disputed'))).toBe(false)
  })

  it('filtr "completed" zwraca true tylko dla completed', () => {
    // Arrange
    // Act & Assert
    expect(itemMatchesFilter(item, 'completed', statusMap('completed'))).toBe(true)
    for (const status of [...ACTIVE_STATUSES, 'rejected', 'disputed'] as BetStatus[]) {
      expect(itemMatchesFilter(item, 'completed', statusMap(status))).toBe(false)
    }
  })

  it('filtr "all" zwraca true dla każdego statusu', () => {
    // Arrange
    // Act & Assert
    for (const status of ALL_STATUSES) {
      expect(itemMatchesFilter(item, 'all', statusMap(status))).toBe(true)
    }
  })
})
