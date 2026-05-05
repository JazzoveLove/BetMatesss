import { act, renderHook, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'

jest.mock('../../contexts/AuthContext', () => ({
  useAuthContext: jest.fn(),
}))

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: () => void) => cb(),
}))

jest.mock('../../services/friends.service', () => ({
  loadFriendships: jest.fn(),
  ensureMyInviteCode: jest.fn(),
  acceptFriendship: jest.fn(),
  rejectFriendship: jest.fn(),
  handleFriendInvite: jest.fn(),
  subscribeFriendshipChanges: jest.fn(() => jest.fn()),
}))

jest.mock('../../lib/friend-invite-queue', () => ({
  drainFriendInvites: jest.fn(() => []),
  subscribeFriendInvites: jest.fn(() => jest.fn()),
}))

import { useAuthContext } from '../../contexts/AuthContext'
import {
  acceptFriendship,
  ensureMyInviteCode,
  loadFriendships,
  rejectFriendship,
} from '../../services/friends.service'
import { useFriends } from '../../hooks/useFriends'

describe('useFriends', () => {
  let mockAlert: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    mockAlert = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn())
    ;(useAuthContext as jest.Mock).mockReturnValue({ userId: 'u1' })
    ;(loadFriendships as jest.Mock).mockResolvedValue({
      incoming: [{ id: 'f1' }],
      outgoing: [{ id: 'f2' }],
      friends: [{ id: 'f3', userAId: 'u1', userBId: 'u2', status: 'accepted' }],
      nickById: { u2: 'Alex' },
      avatarById: { u2: null },
    })
    ;(ensureMyInviteCode as jest.Mock).mockResolvedValue('INV12345')
  })

  afterEach(() => {
    mockAlert.mockRestore()
  })

  it('should fetch friends and invite code on load', async () => {
    // Arrange
    const { result } = renderHook(() => useFriends())

    // Act
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Assert
    expect(result.current.myInviteCode).toBe('INV12345')
    expect(result.current.friends).toHaveLength(1)
  })

  it('should expose incoming and outgoing invites', async () => {
    // Arrange
    const { result } = renderHook(() => useFriends())

    // Act
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Assert
    expect(result.current.incoming).toHaveLength(1)
    expect(result.current.outgoing).toHaveLength(1)
  })

  it('should handle refresh state around onRefresh', async () => {
    // Arrange
    const { result } = renderHook(() => useFriends())
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Act
    await act(async () => {
      await result.current.onRefresh()
    })

    // Assert
    expect(result.current.refreshing).toBe(false)
    expect(loadFriendships).toHaveBeenCalled()
  })

  it('should call acceptFriendship and reload list', async () => {
    // Arrange
    ;(acceptFriendship as jest.Mock).mockResolvedValue({ error: null })
    const { result } = renderHook(() => useFriends())
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Act
    await act(async () => {
      await result.current.accept({ id: 'f1' } as never)
    })

    // Assert
    expect(acceptFriendship).toHaveBeenCalledWith('f1')
    expect(loadFriendships).toHaveBeenCalled()
  })

  it('should show alert when reject fails', async () => {
    // Arrange
    ;(rejectFriendship as jest.Mock).mockResolvedValue({ error: 'reject failed' })
    const { result } = renderHook(() => useFriends())
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Act
    await act(async () => {
      await result.current.reject({ id: 'f1' } as never)
    })

    // Assert
    expect(mockAlert).toHaveBeenCalledWith('Błąd', 'reject failed')
  })
})
