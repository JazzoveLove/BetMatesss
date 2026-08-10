import { supabase } from '@/shared/lib/supabase'
import { AuthService } from '@/features/auth/api/auth.service'

jest.mock('@/shared/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}))

const mockGetSession = supabase.auth.getSession as jest.Mock

beforeEach(() => {
  mockGetSession.mockReset()
})

describe('AuthService.getCurrentUserId', () => {
  it('zwraca null gdy brak sesji', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })

    const userId = await AuthService.getCurrentUserId()

    expect(userId).toBeNull()
  })

  it('zwraca id użytkownika, gdy sesja istnieje', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } }, error: null })

    const userId = await AuthService.getCurrentUserId()

    expect(userId).toBe('user-1')
  })
})
