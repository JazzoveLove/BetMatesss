import { chainResponse } from '../helpers/supabaseMock'

import { supabase } from '@/shared/lib/supabase'
import { getPairPendingPayments } from '@/features/friend-detail/api/friendDetail.pendingPayments'

jest.mock('@/shared/lib/supabase', () => {
  const { createSupabaseMock } = require('../helpers/supabaseMock')
  return createSupabaseMock()
})

const mockFrom = supabase.from as jest.Mock

beforeEach(() => {
  mockFrom.mockReset()
})

describe('getPairPendingPayments', () => {
  it('filtruje po status=pending, deleted_at null i parze (obie strony); mapuje snake→camel', async () => {
    const chain = chainResponse({
      data: [
        {
          id: 'pay-1',
          from_user: 'me',
          to_user: 'friend',
          amount: '40',
          created_by: 'me',
          created_at: '2026-08-25T09:00:00.000Z',
        },
      ],
      error: null,
    })
    mockFrom.mockReturnValueOnce(chain)

    const result = await getPairPendingPayments('me', 'friend')

    expect(mockFrom).toHaveBeenCalledWith('payments')
    expect(chain.eq).toHaveBeenCalledWith('status', 'pending')
    expect(chain.is).toHaveBeenCalledWith('deleted_at', null)
    expect(chain.or).toHaveBeenCalledWith(
      'and(from_user.eq.me,to_user.eq.friend),and(from_user.eq.friend,to_user.eq.me)',
    )
    expect(result).toEqual([
      {
        id: 'pay-1',
        fromUser: 'me',
        toUser: 'friend',
        amount: 40,
        createdBy: 'me',
        createdAt: '2026-08-25T09:00:00.000Z',
      },
    ])
  })

  it('błąd zapytania → pusta lista (fail-open, jak getSettlements)', async () => {
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: { message: 'boom' } }))

    const result = await getPairPendingPayments('me', 'friend')

    expect(result).toEqual([])
  })

  it('brak wierszy → pusta lista', async () => {
    mockFrom.mockReturnValueOnce(chainResponse({ data: [], error: null }))

    await expect(getPairPendingPayments('me', 'friend')).resolves.toEqual([])
  })
})
