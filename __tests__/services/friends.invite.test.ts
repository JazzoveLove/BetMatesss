import { chainResponse } from '../helpers/supabaseMock'

jest.mock('../../lib/supabase', () => {
  const { createSupabaseMock } = require('../helpers/supabaseMock')
  return createSupabaseMock()
})

import { supabase } from '../../lib/supabase'
import {
  ensureMyInviteCode,
  lookupUserByCode,
  handleFriendInvite,
  searchUsersByNick,
} from '../../services/friends/friends.invite'

const mockFrom = supabase.from as jest.Mock
const mockRpc = supabase.rpc as jest.Mock

beforeEach(() => {
  mockFrom.mockReset()
  mockRpc.mockReset()
})

describe('ensureMyInviteCode', () => {
  it('zwraca istniejący kod z bazy bez generowania nowego', async () => {
    // Arrange
    mockFrom.mockReturnValueOnce(
      chainResponse({ data: { invite_code: 'EXISTING1' }, error: null }),
    )

    // Act
    const code = await ensureMyInviteCode('user-1')

    // Assert
    expect(code).toBe('EXISTING1')
    expect(mockFrom).toHaveBeenCalledTimes(1)
  })

  it('generuje i zapisuje nowy kod gdy użytkownik go jeszcze nie ma', async () => {
    // Arrange
    mockFrom.mockReturnValueOnce(chainResponse({ data: { invite_code: null }, error: null }))
    mockFrom.mockReturnValueOnce(
      chainResponse({ data: { invite_code: 'NEWCODE1' }, error: null }),
    )

    // Act
    const code = await ensureMyInviteCode('user-1')

    // Assert
    expect(code).toBe('NEWCODE1')
  })

  it('ponawia próbę po kolizji unikalności i ostatecznie zwraca wygenerowany kod', async () => {
    // Arrange
    mockFrom.mockReturnValueOnce(chainResponse({ data: { invite_code: null }, error: null }))
    mockFrom.mockReturnValueOnce(
      chainResponse({ data: null, error: { code: '23505', message: 'duplicate key' } }),
    )
    mockFrom.mockReturnValueOnce(
      chainResponse({ data: null, error: { code: '23505', message: 'duplicate key' } }),
    )
    mockFrom.mockReturnValueOnce(
      chainResponse({ data: { invite_code: 'AFTERCOLLISION' }, error: null }),
    )

    // Act
    const code = await ensureMyInviteCode('user-1')

    // Assert
    expect(code).toBe('AFTERCOLLISION')
  })

  it('zwraca null gdy wszystkie próby generowania kodu kończą się kolizją', async () => {
    // Arrange
    mockFrom.mockReturnValueOnce(chainResponse({ data: { invite_code: null }, error: null }))
    mockFrom.mockReturnValue(
      chainResponse({ data: null, error: { code: '23505', message: 'duplicate key' } }),
    )

    // Act
    const code = await ensureMyInviteCode('user-1')

    // Assert
    expect(code).toBeNull()
  })
})

describe('lookupUserByCode', () => {
  it('zwraca userId i nick gdy kod istnieje', async () => {
    // Arrange
    mockRpc.mockReturnValueOnce(
      chainResponse({ data: [{ user_id: 'user-1', user_nick: 'Maciek' }], error: null }),
    )

    // Act
    const result = await lookupUserByCode('ABC12345')

    // Assert
    expect(result).toEqual({ userId: 'user-1', nick: 'Maciek' })
  })

  it('zwraca missingFunction gdy funkcja RPC nie istnieje w bazie', async () => {
    // Arrange
    mockRpc.mockReturnValueOnce(
      chainResponse({
        data: null,
        error: { message: 'function lookup_user_by_invite_code does not exist' },
      }),
    )

    // Act
    const result = await lookupUserByCode('ABC12345')

    // Assert
    expect(result).toEqual({
      error: 'function lookup_user_by_invite_code does not exist',
      missingFunction: true,
    })
  })

  it('zwraca błąd not_found gdy kod nie pasuje do żadnego użytkownika', async () => {
    // Arrange
    mockRpc.mockReturnValueOnce(chainResponse({ data: [], error: null }))

    // Act
    const result = await lookupUserByCode('ZZZZZZZZ')

    // Assert
    expect(result).toEqual({ error: 'not_found' })
  })
})

describe('handleFriendInvite', () => {
  it('zwraca type self gdy użytkownik zaprasza sam siebie', async () => {
    // Arrange
    const userId = 'user-1'

    // Act
    const result = await handleFriendInvite(userId, userId)

    // Assert
    expect(result).toEqual({ type: 'self' })
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('zwraca type not_found gdy zapraszany użytkownik nie istnieje', async () => {
    // Arrange
    mockRpc.mockReturnValueOnce(chainResponse({ data: false, error: null }))

    // Act
    const result = await handleFriendInvite('user-1', 'user-2')

    // Assert
    expect(result).toEqual({ type: 'not_found' })
  })

  it('zwraca type already_friends gdy relacja jest już zaakceptowana', async () => {
    // Arrange
    mockRpc.mockReturnValueOnce(chainResponse({ data: true, error: null }))
    mockFrom.mockReturnValueOnce(
      chainResponse({
        data: { id: 'f1', user_a: 'user-1', user_b: 'user-2', status: 'accepted' },
        error: null,
      }),
    )

    // Act
    const result = await handleFriendInvite('user-1', 'user-2')

    // Assert
    expect(result).toEqual({ type: 'already_friends' })
  })

  it('akceptuje zaproszenie i zwraca type accepted gdy druga strona już zaprosiła', async () => {
    // Arrange
    mockRpc.mockReturnValueOnce(chainResponse({ data: true, error: null }))
    mockFrom.mockReturnValueOnce(
      chainResponse({
        data: { id: 'f1', user_a: 'user-2', user_b: 'user-1', status: 'pending' },
        error: null,
      }),
    )
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: null }))

    // Act
    const result = await handleFriendInvite('user-1', 'user-2')

    // Assert
    expect(result).toEqual({ type: 'accepted' })
  })

  it('zwraca type already_sent gdy to ja już wcześniej wysłałem zaproszenie', async () => {
    // Arrange
    mockRpc.mockReturnValueOnce(chainResponse({ data: true, error: null }))
    mockFrom.mockReturnValueOnce(
      chainResponse({
        data: { id: 'f1', user_a: 'user-1', user_b: 'user-2', status: 'pending' },
        error: null,
      }),
    )

    // Act
    const result = await handleFriendInvite('user-1', 'user-2')

    // Assert
    expect(result).toEqual({ type: 'already_sent' })
  })

  it('wysyła nowe zaproszenie i zwraca type sent gdy nie ma żadnej relacji', async () => {
    // Arrange
    mockRpc.mockReturnValueOnce(chainResponse({ data: true, error: null }))
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: null }))
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: null }))

    // Act
    const result = await handleFriendInvite('user-1', 'user-2')

    // Assert
    expect(result).toEqual({ type: 'sent' })
  })

  it('zwraca type duplicate gdy insert zakończy się błędem 23505', async () => {
    // Arrange
    mockRpc.mockReturnValueOnce(chainResponse({ data: true, error: null }))
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: null }))
    mockFrom.mockReturnValueOnce(
      chainResponse({ data: null, error: { code: '23505', message: 'duplicate key' } }),
    )

    // Act
    const result = await handleFriendInvite('user-1', 'user-2')

    // Assert
    expect(result).toEqual({ type: 'duplicate' })
  })
})

describe('searchUsersByNick', () => {
  it('zwraca pustą tablicę bez odpytywania bazy gdy zapytanie ma mniej niż 2 znaki', async () => {
    // Arrange
    const query = 'a'

    // Act
    const result = await searchUsersByNick(query, 'user-1')

    // Assert
    expect(result).toEqual([])
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('wyklucza z wyników użytkownika o podanym excludeId', async () => {
    // Arrange
    mockFrom.mockReturnValueOnce(
      chainResponse({
        data: [
          { id: 'user-1', nick: 'Maciek' },
          { id: 'user-2', nick: 'Maciej' },
        ],
        error: null,
      }),
    )

    // Act
    const result = await searchUsersByNick('Maci', 'user-1')

    // Assert
    expect(result).toEqual([{ id: 'user-2', nick: 'Maciej' }])
  })
})
