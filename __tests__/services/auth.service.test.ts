jest.mock('@/shared/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}))

import { supabase } from '@/shared/lib/supabase'
import { AuthService } from '@/features/auth/api/auth.service'

const mockGetSession = supabase.auth.getSession as jest.Mock

beforeEach(() => {
  mockGetSession.mockReset()
})

describe('AuthService.getCurrentUserId', () => {
  it('zwraca null gdy brak sesji', async () => {
    // Arrange
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })

    // Act
    const userId = await AuthService.getCurrentUserId()

    // Assert
    expect(userId).toBeNull()
  })

  it('zwraca id użytkownika, gdy sesja istnieje', async () => {
    // Arrange
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } }, error: null })

    // Act
    const userId = await AuthService.getCurrentUserId()

    // Assert
    expect(userId).toBe('user-1')
  })
})
