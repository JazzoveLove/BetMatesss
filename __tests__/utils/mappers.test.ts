import { mapUserProfileRow } from '@/shared/utils/mappers'
import { DELETED_USER_NICK } from '@/shared/constants/user/deletedUser'
import type { UserProfileRow } from '@/shared/types/user.types'

function baseRow(overrides: Partial<UserProfileRow> = {}): UserProfileRow {
  return {
    id: 'user-1',
    nick: 'Kuba',
    deleted_at: null,
    avatar_url: null,
    invite_code: null,
    created_at: null,
    ...overrides,
  }
}

describe('mapUserProfileRow', () => {
  it('deleted_at ustawiony → nick zastąpiony DELETED_USER_NICK, nie prawdziwym nickiem', () => {
    const result = mapUserProfileRow(baseRow({ nick: 'PrawdziwyNick', deleted_at: '2026-01-01T00:00:00Z' }))

    expect(result.nick).toBe(DELETED_USER_NICK)
  })

  it('avatar_url/invite_code/created_at = null → undefined w wyniku, nie null', () => {
    const result = mapUserProfileRow(baseRow({ avatar_url: null, invite_code: null, created_at: null }))

    expect(result.avatarUrl).toBeUndefined()
    expect(result.inviteCode).toBeUndefined()
    expect(result.createdAt).toBeUndefined()
    expect(result.avatarUrl).not.toBeNull()
    expect(result.inviteCode).not.toBeNull()
    expect(result.createdAt).not.toBeNull()
  })

  it('pełne dane → mapowanie 1:1', () => {
    const result = mapUserProfileRow(
      baseRow({
        id: 'user-2',
        nick: 'Ola',
        avatar_url: 'https://example.com/avatar.png',
        invite_code: 'ABC123',
        created_at: '2026-01-01T00:00:00Z',
      }),
    )

    expect(result).toEqual({
      id: 'user-2',
      nick: 'Ola',
      avatarUrl: 'https://example.com/avatar.png',
      inviteCode: 'ABC123',
      createdAt: '2026-01-01T00:00:00Z',
    })
  })
})
