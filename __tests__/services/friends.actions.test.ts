import { chainResponse } from '../helpers/supabaseMock'

jest.mock('@/shared/lib/supabase', () => {
  const { createSupabaseMock } = require('../helpers/supabaseMock')
  return createSupabaseMock()
})

import { supabase } from '@/shared/lib/supabase'
import {
  acceptFriendship,
  rejectFriendship,
  ensureFriendshipAccepted,
} from '@/features/friends/api/friends.actions'

const mockFrom = supabase.from as jest.Mock

beforeEach(() => {
  mockFrom.mockReset()
})

describe('acceptFriendship', () => {
  it('zwraca pusty obiekt gdy aktualizacja statusu się powiedzie', async () => {
    // Arrange
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: null }))

    // Act
    const result = await acceptFriendship('friendship-1')

    // Assert
    expect(result).toEqual({})
  })

  it('zwraca komunikat błędu gdy aktualizacja statusu się nie powiedzie', async () => {
    // Arrange
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: { message: 'DB error' } }))

    // Act
    const result = await acceptFriendship('friendship-1')

    // Assert
    expect(result).toEqual({ error: 'DB error' })
  })
})

describe('rejectFriendship', () => {
  it('zwraca pusty obiekt gdy usunięcie relacji się powiedzie', async () => {
    // Arrange
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: null }))

    // Act
    const result = await rejectFriendship('friendship-1')

    // Assert
    expect(result).toEqual({})
  })

  it('zwraca komunikat błędu gdy usunięcie relacji się nie powiedzie', async () => {
    // Arrange
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: { message: 'DB error' } }))

    // Act
    const result = await rejectFriendship('friendship-1')

    // Assert
    expect(result).toEqual({ error: 'DB error' })
  })
})

describe('ensureFriendshipAccepted', () => {
  it('zwraca pusty obiekt bez odpytywania bazy gdy oba ID to ten sam użytkownik', async () => {
    // Arrange
    const userId = 'user-1'

    // Act
    const result = await ensureFriendshipAccepted(userId, userId)

    // Assert
    expect(result).toEqual({})
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('zwraca pusty obiekt gdy relacja już ma status accepted', async () => {
    // Arrange
    mockFrom.mockReturnValueOnce(
      chainResponse({ data: { id: 'f1', status: 'accepted' }, error: null }),
    )

    // Act
    const result = await ensureFriendshipAccepted('user-1', 'user-2')

    // Assert
    expect(result).toEqual({})
  })

  it('aktualizuje status do accepted gdy istnieje relacja pending', async () => {
    // Arrange
    mockFrom.mockReturnValueOnce(
      chainResponse({ data: { id: 'f1', status: 'pending' }, error: null }),
    )
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: null }))

    // Act
    const result = await ensureFriendshipAccepted('user-1', 'user-2')

    // Assert
    expect(result).toEqual({})
  })

  it('wstawia nową zaakceptowaną relację gdy żadna nie istnieje', async () => {
    // Arrange
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: null }))
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: null }))

    // Act
    const result = await ensureFriendshipAccepted('user-1', 'user-2')

    // Assert
    expect(result).toEqual({})
  })

  it('traktuje błąd 23505 przy wstawianiu jako sukces (race condition)', async () => {
    // Arrange
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: null }))
    mockFrom.mockReturnValueOnce(
      chainResponse({ data: null, error: { code: '23505', message: 'duplicate key' } }),
    )

    // Act
    const result = await ensureFriendshipAccepted('user-1', 'user-2')

    // Assert
    expect(result).toEqual({})
  })
})
