import { chainResponse } from '../helpers/supabaseMock'

import { supabase } from '@/shared/lib/supabase'
import { recordPayment } from '@/features/friend-detail/api/friendDetail.settle'

jest.mock('@/shared/lib/supabase', () => {
  const { createSupabaseMock } = require('../helpers/supabaseMock')
  return createSupabaseMock()
})

const mockFrom = supabase.from as jest.Mock

beforeEach(() => {
  mockFrom.mockReset()
})

describe('recordPayment', () => {
  it('amount = 0 → błąd, brak insertu', async () => {
    const result = await recordPayment('user-1', 'user-2', 0, 'user-1')

    expect(result).toEqual({ error: 'Kwota musi być większa od zera.' })
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('amount = -10 → błąd, brak insertu', async () => {
    const result = await recordPayment('user-1', 'user-2', -10, 'user-1')

    expect(result).toEqual({ error: 'Kwota musi być większa od zera.' })
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('sukces → insert z dokładnie {from_user, to_user, amount, created_by}', async () => {
    const insertChain = chainResponse({ data: null, error: null })
    mockFrom.mockReturnValueOnce(insertChain)

    const result = await recordPayment('user-1', 'user-2', 50, 'user-1')

    expect(insertChain.insert).toHaveBeenCalledWith({
      from_user: 'user-1',
      to_user: 'user-2',
      amount: 50,
      created_by: 'user-1',
    })
    expect(result).toEqual({})
  })

  it('błąd bazy → propaguje error.message', async () => {
    const insertChain = chainResponse({ data: null, error: { message: 'insert failed' } })
    mockFrom.mockReturnValueOnce(insertChain)

    const result = await recordPayment('user-1', 'user-2', 50, 'user-1')

    expect(result).toEqual({ error: 'insert failed' })
  })
})
