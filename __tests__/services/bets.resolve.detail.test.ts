import { chainResponse } from '../helpers/supabaseMock'

import { supabase } from '@/shared/lib/supabase'
import { getBetDetail } from '@/features/bets/api/bets.resolve.detail'

jest.mock('@/shared/lib/supabase', () => {
  const { createSupabaseMock } = require('../helpers/supabaseMock')
  return createSupabaseMock()
})

const mockFrom = supabase.from as jest.Mock

const baseBet = {
  id: 'bet-1',
  creator_id: 'user-1',
  game_template: 'FIFA',
  format: 'single',
  stake_mode: 'equal',
  status: 'active',
  created_at: '2026-08-01T00:00:00Z',
}

beforeEach(() => {
  mockFrom.mockReset()
})

describe('getBetDetail', () => {
  it('deduplikacja uczestników po user_id — duplikat znika, nie dubluje wpisu', async () => {
    mockFrom.mockReturnValueOnce(
      chainResponse({
        data: {
          ...baseBet,
          bet_participants: [
            { user_id: 'user-1', stake_amount: 50, odds: 2, role: 'creator', confirmed: true, users: { nick: 'Kuba', deleted_at: null } },
            // duplikat tego samego user_id — np. race po ponownym joinie
            { user_id: 'user-1', stake_amount: 999, odds: 9, role: 'creator', confirmed: false, users: { nick: 'Inny', deleted_at: null } },
            { user_id: 'user-2', stake_amount: 50, odds: 2, role: 'opponent', confirmed: true, users: { nick: 'Ola', deleted_at: null } },
          ],
          bet_results: [],
        },
        error: null,
      }),
    )

    const result = await getBetDetail('bet-1')

    expect(result?.participants.map(p => p.id)).toEqual(['user-1', 'user-2'])
    expect(result?.participants.filter(p => p.id === 'user-1')).toHaveLength(1)
    // pierwsze wystąpienie wygrywa — nie ostatnie
    expect(result?.participants.find(p => p.id === 'user-1')?.nick).toBe('Kuba')
  })

  it('normalizeUsersNick: users jako pojedynczy obiekt → poprawny nick', async () => {
    mockFrom.mockReturnValueOnce(
      chainResponse({
        data: {
          ...baseBet,
          bet_participants: [
            { user_id: 'user-1', stake_amount: 50, odds: 2, role: 'creator', confirmed: true, users: { nick: 'Kuba', deleted_at: null } },
          ],
          bet_results: [],
        },
        error: null,
      }),
    )

    const result = await getBetDetail('bet-1')

    expect(result?.participants[0].nick).toBe('Kuba')
  })

  it('normalizeUsersNick: users jako tablica (join zwrócił array) → poprawny nick', async () => {
    mockFrom.mockReturnValueOnce(
      chainResponse({
        data: {
          ...baseBet,
          bet_participants: [
            { user_id: 'user-1', stake_amount: 50, odds: 2, role: 'creator', confirmed: true, users: [{ nick: 'Ola', deleted_at: null }] },
          ],
          bet_results: [],
        },
        error: null,
      }),
    )

    const result = await getBetDetail('bet-1')

    expect(result?.participants[0].nick).toBe('Ola')
  })

  it('normalizeUsersNick: brak nicka (users === null) → "Nieznany"', async () => {
    mockFrom.mockReturnValueOnce(
      chainResponse({
        data: {
          ...baseBet,
          bet_participants: [
            { user_id: 'user-1', stake_amount: 50, odds: 2, role: 'creator', confirmed: true, users: null },
          ],
          bet_results: [],
        },
        error: null,
      }),
    )

    const result = await getBetDetail('bet-1')

    expect(result?.participants[0].nick).toBe('Nieznany')
  })

  it('bet_results sortowane po match_number rosnąco niezależnie od kolejności z bazy', async () => {
    mockFrom.mockReturnValueOnce(
      chainResponse({
        data: {
          ...baseBet,
          bet_participants: [],
          bet_results: [
            { id: 'r3', match_number: 3, winner_id: 'user-1', scores: { score: '1:0' }, confirmed: true },
            { id: 'r1', match_number: 1, winner_id: 'user-1', scores: { score: '2:1' }, confirmed: true },
            { id: 'r2', match_number: 2, winner_id: 'user-2', scores: { score: '0:1' }, confirmed: true },
          ],
        },
        error: null,
      }),
    )

    const result = await getBetDetail('bet-1')

    expect(result?.results.map(r => r.match_number)).toEqual([1, 2, 3])
  })
})
