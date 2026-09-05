import { chainResponse } from '../helpers/supabaseMock'

import { supabase } from '@/shared/lib/supabase'
import {
  confirmPayment,
  recordPayment,
  rejectPayment,
  retractPayment,
} from '@/features/friend-detail/api/friendDetail.settle'

jest.mock('@/shared/lib/supabase', () => {
  const { createSupabaseMock } = require('../helpers/supabaseMock')
  return createSupabaseMock()
})

const mockFrom = supabase.from as jest.Mock
const mockRpc = supabase.rpc as jest.Mock

beforeEach(() => {
  mockFrom.mockReset()
  mockRpc.mockReset()
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

  it('sukces → insert z dokładnie {from_user, to_user, amount, created_by} (BEZ status)', async () => {
    const insertChain = chainResponse({ data: null, error: null })
    mockFrom.mockReturnValueOnce(insertChain)

    // createdBy = from_user (dłużnik) → trigger nada 'pending'
    const result = await recordPayment('user-1', 'user-2', 50, 'user-1')

    // status NIE jest wysyłany — ustala go trigger set_payment_status_on_insert.
    expect(insertChain.insert).toHaveBeenCalledWith({
      from_user: 'user-1',
      to_user: 'user-2',
      amount: 50,
      created_by: 'user-1',
    })
    expect(result).toEqual({ status: 'pending' })
  })

  it('wpis wierzyciela (createdBy === toUser) → odwzorowany status "confirmed"', async () => {
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: null }))

    const result = await recordPayment('user-1', 'user-2', 50, 'user-2')

    expect(result).toEqual({ status: 'confirmed' })
  })

  it('błąd bazy → propaguje error.message', async () => {
    const insertChain = chainResponse({ data: null, error: { message: 'insert failed' } })
    mockFrom.mockReturnValueOnce(insertChain)

    const result = await recordPayment('user-1', 'user-2', 50, 'user-1')

    expect(result).toEqual({ error: 'insert failed' })
  })
})

describe('confirmPayment / rejectPayment', () => {
  it('confirmPayment → update {status:"confirmed"} po id', async () => {
    const chain = chainResponse({ data: null, error: null })
    mockFrom.mockReturnValueOnce(chain)

    const result = await confirmPayment('pay-1')

    expect(mockFrom).toHaveBeenCalledWith('payments')
    expect(chain.update).toHaveBeenCalledWith({ status: 'confirmed' })
    expect(chain.eq).toHaveBeenCalledWith('id', 'pay-1')
    expect(result).toEqual({})
  })

  it('rejectPayment → update {status:"rejected"} po id', async () => {
    const chain = chainResponse({ data: null, error: null })
    mockFrom.mockReturnValueOnce(chain)

    const result = await rejectPayment('pay-2')

    expect(chain.update).toHaveBeenCalledWith({ status: 'rejected' })
    expect(chain.eq).toHaveBeenCalledWith('id', 'pay-2')
    expect(result).toEqual({})
  })

  it('błąd RLS przy confirm (nie jestem to_user) → propaguje error.message', async () => {
    mockFrom.mockReturnValueOnce(
      chainResponse({ data: null, error: { message: 'row-level security' } }),
    )

    const result = await confirmPayment('pay-3')

    expect(result).toEqual({ error: 'row-level security' })
  })
})

describe('retractPayment', () => {
  it('woła RPC delete_payment z p_payment_id', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null })

    const result = await retractPayment('pay-9')

    expect(mockRpc).toHaveBeenCalledWith('delete_payment', { p_payment_id: 'pay-9' })
    expect(result).toEqual({})
  })

  it('błąd RPC (np. próba wycofania cudzej / potwierdzonej) → propaguje error.message', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Można wycofać tylko nierozpatrzoną spłatę.' },
    })

    const result = await retractPayment('pay-9')

    expect(result).toEqual({ error: 'Można wycofać tylko nierozpatrzoną spłatę.' })
  })
})
