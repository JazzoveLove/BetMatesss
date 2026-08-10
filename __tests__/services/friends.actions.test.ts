import { chainResponse } from '../helpers/supabaseMock'

import { supabase } from '@/shared/lib/supabase'
import {
  acceptFriendship,
  rejectFriendship,
  ensureFriendshipAccepted,
} from '@/features/friends/api/friends.actions'

jest.mock('@/shared/lib/supabase', () => {
  const { createSupabaseMock } = require('../helpers/supabaseMock')
  return createSupabaseMock()
})

const mockFrom = supabase.from as jest.Mock

beforeEach(() => {
  mockFrom.mockReset()
})

describe('acceptFriendship', () => {
  it('zwraca pusty obiekt gdy aktualizacja statusu się powiedzie', async () => {
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: null }))

    const result = await acceptFriendship('friendship-1')

    expect(result).toEqual({})
  })

  it('zwraca komunikat błędu gdy aktualizacja statusu się nie powiedzie', async () => {
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: { message: 'DB error' } }))

    const result = await acceptFriendship('friendship-1')

    expect(result).toEqual({ error: 'DB error' })
  })
})

describe('rejectFriendship', () => {
  it('zwraca pusty obiekt gdy usunięcie relacji się powiedzie', async () => {
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: null }))

    const result = await rejectFriendship('friendship-1')

    expect(result).toEqual({})
  })

  it('zwraca komunikat błędu gdy usunięcie relacji się nie powiedzie', async () => {
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: { message: 'DB error' } }))

    const result = await rejectFriendship('friendship-1')

    expect(result).toEqual({ error: 'DB error' })
  })
})

describe('ensureFriendshipAccepted', () => {
  it('zwraca pusty obiekt bez odpytywania bazy gdy oba ID to ten sam użytkownik', async () => {
    const userId = 'user-1'

    const result = await ensureFriendshipAccepted(userId, userId)

    expect(result).toEqual({})
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('zwraca pusty obiekt gdy relacja już ma status accepted', async () => {
    mockFrom.mockReturnValueOnce(
      chainResponse({ data: { id: 'f1', status: 'accepted' }, error: null }),
    )

    const result = await ensureFriendshipAccepted('user-1', 'user-2')

    expect(result).toEqual({})
  })

  it('aktualizuje status do accepted gdy istnieje relacja pending', async () => {
    mockFrom.mockReturnValueOnce(
      chainResponse({ data: { id: 'f1', status: 'pending' }, error: null }),
    )
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: null }))

    const result = await ensureFriendshipAccepted('user-1', 'user-2')

    expect(result).toEqual({})
  })

  it('wstawia nową zaakceptowaną relację gdy żadna nie istnieje', async () => {
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: null }))
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: null }))

    const result = await ensureFriendshipAccepted('user-1', 'user-2')

    expect(result).toEqual({})
  })

  it('traktuje błąd 23505 przy wstawianiu jako sukces (race condition)', async () => {
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: null }))
    mockFrom.mockReturnValueOnce(
      chainResponse({ data: null, error: { code: '23505', message: 'duplicate key' } }),
    )

    const result = await ensureFriendshipAccepted('user-1', 'user-2')

    expect(result).toEqual({})
  })
})
