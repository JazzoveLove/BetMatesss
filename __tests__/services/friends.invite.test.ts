import { chainResponse } from '../helpers/supabaseMock'

import { supabase } from '@/shared/lib/supabase'
import {
  ensureMyInviteCode,
  lookupUserByCode,
  handleFriendInvite,
} from '@/features/friends/api/friends.invite'

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

describe('ensureMyInviteCode', () => {
  it('zwraca istniejący kod z bazy bez generowania nowego', async () => {
    mockFrom.mockReturnValueOnce(
      chainResponse({ data: { invite_code: 'EXISTING1' }, error: null }),
    )

    const code = await ensureMyInviteCode('user-1')

    expect(code).toBe('EXISTING1')
    expect(mockFrom).toHaveBeenCalledTimes(1)
  })

  it('generuje i zapisuje nowy kod gdy użytkownik go jeszcze nie ma', async () => {
    mockFrom.mockReturnValueOnce(chainResponse({ data: { invite_code: null }, error: null }))
    mockFrom.mockReturnValueOnce(
      chainResponse({ data: { invite_code: 'NEWCODE1' }, error: null }),
    )

    const code = await ensureMyInviteCode('user-1')

    expect(code).toBe('NEWCODE1')
  })

  it('ponawia próbę po kolizji unikalności i ostatecznie zwraca wygenerowany kod', async () => {
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

    const code = await ensureMyInviteCode('user-1')

    expect(code).toBe('AFTERCOLLISION')
  })

  it('zwraca null gdy wszystkie próby generowania kodu kończą się kolizją', async () => {
    mockFrom.mockReturnValueOnce(chainResponse({ data: { invite_code: null }, error: null }))
    mockFrom.mockReturnValue(
      chainResponse({ data: null, error: { code: '23505', message: 'duplicate key' } }),
    )

    const code = await ensureMyInviteCode('user-1')

    expect(code).toBeNull()
  })
})

describe('lookupUserByCode', () => {
  it('zwraca userId i nick gdy kod istnieje', async () => {
    mockRpc.mockReturnValueOnce(
      chainResponse({ data: [{ user_id: 'user-1', user_nick: 'Maciek' }], error: null }),
    )

    const result = await lookupUserByCode('ABC12345')

    expect(result).toEqual({ userId: 'user-1', nick: 'Maciek' })
  })

  it('zwraca missingFunction gdy funkcja RPC nie istnieje w bazie', async () => {
    mockRpc.mockReturnValueOnce(
      chainResponse({
        data: null,
        error: { message: 'function lookup_user_by_invite_code does not exist' },
      }),
    )

    const result = await lookupUserByCode('ABC12345')

    expect(result).toEqual({
      error: 'function lookup_user_by_invite_code does not exist',
      missingFunction: true,
    })
  })

  it('zwraca błąd not_found gdy kod nie pasuje do żadnego użytkownika', async () => {
    mockRpc.mockReturnValueOnce(chainResponse({ data: [], error: null }))

    const result = await lookupUserByCode('ZZZZZZZZ')

    expect(result).toEqual({ error: 'not_found' })
  })
})

describe('handleFriendInvite', () => {
  it('zwraca type self gdy użytkownik zaprasza sam siebie', async () => {
    const userId = 'user-1'

    const result = await handleFriendInvite(userId, userId)

    expect(result).toEqual({ type: 'self' })
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('zwraca type not_found gdy zapraszany użytkownik nie istnieje', async () => {
    mockRpc.mockReturnValueOnce(chainResponse({ data: false, error: null }))

    const result = await handleFriendInvite('user-1', 'user-2')

    expect(result).toEqual({ type: 'not_found' })
  })

  it('zwraca type already_friends gdy relacja jest już zaakceptowana', async () => {
    mockRpc.mockReturnValueOnce(chainResponse({ data: true, error: null }))
    mockFrom.mockReturnValueOnce(
      chainResponse({
        data: { id: 'f1', user_a: 'user-1', user_b: 'user-2', status: 'accepted' },
        error: null,
      }),
    )

    const result = await handleFriendInvite('user-1', 'user-2')

    expect(result).toEqual({ type: 'already_friends' })
  })

  it('akceptuje zaproszenie i zwraca type accepted gdy druga strona już zaprosiła', async () => {
    mockRpc.mockReturnValueOnce(chainResponse({ data: true, error: null }))
    mockFrom.mockReturnValueOnce(
      chainResponse({
        data: { id: 'f1', user_a: 'user-2', user_b: 'user-1', status: 'pending' },
        error: null,
      }),
    )
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: null }))

    const result = await handleFriendInvite('user-1', 'user-2')

    expect(result).toEqual({ type: 'accepted' })
  })

  it('zwraca type already_sent gdy to ja już wcześniej wysłałem zaproszenie', async () => {
    mockRpc.mockReturnValueOnce(chainResponse({ data: true, error: null }))
    mockFrom.mockReturnValueOnce(
      chainResponse({
        data: { id: 'f1', user_a: 'user-1', user_b: 'user-2', status: 'pending' },
        error: null,
      }),
    )

    const result = await handleFriendInvite('user-1', 'user-2')

    expect(result).toEqual({ type: 'already_sent' })
  })

  it('wysyła nowe zaproszenie i zwraca type sent gdy nie ma żadnej relacji', async () => {
    mockRpc.mockReturnValueOnce(chainResponse({ data: true, error: null }))
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: null }))
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: null }))

    const result = await handleFriendInvite('user-1', 'user-2')

    expect(result).toEqual({ type: 'sent' })
  })

  it('zwraca type duplicate gdy insert zakończy się błędem 23505', async () => {
    mockRpc.mockReturnValueOnce(chainResponse({ data: true, error: null }))
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: null }))
    mockFrom.mockReturnValueOnce(
      chainResponse({ data: null, error: { code: '23505', message: 'duplicate key' } }),
    )

    const result = await handleFriendInvite('user-1', 'user-2')

    expect(result).toEqual({ type: 'duplicate' })
  })
})
