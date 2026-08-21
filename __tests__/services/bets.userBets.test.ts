import { mockTable } from '../helpers/supabaseMock'

import { supabase } from '@/shared/lib/supabase'
import { getUserBets } from '@/features/bets/api/bets.userBets'

jest.mock('@/shared/lib/supabase', () => {
  const { createSupabaseMock } = require('../helpers/supabaseMock')
  return createSupabaseMock()
})

const mockFrom = supabase.from as jest.Mock

beforeEach(() => {
  mockFrom.mockReset()
})

function betRow(id: string, creatorId: string, createdAt: string) {
  return {
    id,
    creator_id: creatorId,
    game_template: 'FIFA',
    format: 'single',
    stake_mode: 'equal',
    status: 'active',
    created_at: createdAt,
    rejected_at: null,
  }
}

describe('getUserBets', () => {
  it('filtr "tylko moje zakłady" faktycznie odcina cudze zakłady', async () => {
    // W tabeli `bets` istnieje realnie zakład user-2 (b2) — .eq('creator_id', 'user-1')
    // musi go faktycznie wykluczyć, a nie tylko zwrócić to, co ktoś z góry zaszył.
    const betsTable = mockTable([
      betRow('b1', 'user-1', '2026-08-01T00:00:00Z'),
      betRow('b2', 'user-2', '2026-08-02T00:00:00Z'),
    ])
    // W tabeli `bet_participants` user-1 nie jest uczestnikiem b2 — realny
    // .eq('user_id', 'user-1') musi wykluczyć wiersz user-2/b2 razem z jego
    // zagnieżdżonym `bets`.
    const participantsTable = mockTable([
      { user_id: 'user-1', bets: betRow('b1', 'user-1', '2026-08-01T00:00:00Z') },
      { user_id: 'user-2', bets: betRow('b2', 'user-2', '2026-08-02T00:00:00Z') },
    ])
    mockFrom.mockReturnValueOnce(betsTable).mockReturnValueOnce(participantsTable)

    const result = await getUserBets('user-1')

    expect(result.map(b => b.id)).toEqual(['b1'])
    expect(result.some(b => b.id === 'b2')).toBe(false)
  })

  it('zakład, w którym user-1 jest tylko uczestnikiem (nie twórcą), też się liczy jako "mój"', async () => {
    const betsTable = mockTable([betRow('b1', 'user-2', '2026-08-01T00:00:00Z')])
    const participantsTable = mockTable([
      { user_id: 'user-1', bets: betRow('b1', 'user-2', '2026-08-01T00:00:00Z') },
    ])
    mockFrom.mockReturnValueOnce(betsTable).mockReturnValueOnce(participantsTable)

    const result = await getUserBets('user-1')

    expect(result.map(b => b.id)).toEqual(['b1'])
  })
})
