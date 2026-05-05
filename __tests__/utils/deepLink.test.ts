jest.mock('expo-linking', () => ({
  parse: jest.fn(),
}))

import * as Linking from 'expo-linking'
import { extractBetInviteCodeFromUrl } from '../../lib/bet-invite-url'
import { extractFriendIdFromUrl, isLikelyUserUuid } from '../../lib/friend-invite-url'

describe('extractBetInviteCodeFromUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should extract code from host=join links', () => {
    // Arrange
    ;(Linking.parse as jest.Mock).mockReturnValue({ hostname: 'join', path: 'ABC12345' })

    // Act
    const result = extractBetInviteCodeFromUrl('betmates://join/ABC12345')

    // Assert
    expect(result).toBe('ABC12345')
  })

  it('should extract code from path prefix links', () => {
    // Arrange
    ;(Linking.parse as jest.Mock).mockReturnValue({ hostname: '', path: 'join/XYZ99' })

    // Act
    const result = extractBetInviteCodeFromUrl('https://example.com/join/XYZ99')

    // Assert
    expect(result).toBe('XYZ99')
  })

  it('should decode URL encoded invite code', () => {
    // Arrange
    ;(Linking.parse as jest.Mock).mockReturnValue({ hostname: 'join', path: 'CODE%2F01' })

    // Act
    const result = extractBetInviteCodeFromUrl('betmates://join/CODE%2F01')

    // Assert
    expect(result).toBe('CODE/01')
  })

  it('should return null for malformed or unsupported links', () => {
    // Arrange
    ;(Linking.parse as jest.Mock).mockReturnValue({ hostname: 'other', path: 'x' })

    // Act
    const result = extractBetInviteCodeFromUrl('betmates://other/x')

    // Assert
    expect(result).toBeNull()
  })

  it('should return null when parser throws', () => {
    // Arrange
    ;(Linking.parse as jest.Mock).mockImplementation(() => {
      throw new Error('parse failed')
    })

    // Act
    const result = extractBetInviteCodeFromUrl('not-a-url')

    // Assert
    expect(result).toBeNull()
  })
})

describe('extractFriendIdFromUrl', () => {
  const uuid = '123e4567-e89b-12d3-a456-426614174000'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should extract friend UUID from query parameter', () => {
    // Arrange
    ;(Linking.parse as jest.Mock).mockReturnValue({ queryParams: { add: uuid } })

    // Act
    const result = extractFriendIdFromUrl(`betmates://invite?add=${uuid}`)

    // Assert
    expect(result).toBe(uuid)
  })

  it('should decode encoded UUID from query parameter', () => {
    // Arrange
    ;(Linking.parse as jest.Mock).mockReturnValue({ queryParams: { add: encodeURIComponent(uuid) } })

    // Act
    const result = extractFriendIdFromUrl('betmates://invite?add=encoded')

    // Assert
    expect(result).toBe(uuid)
  })

  it('should return null when add is missing', () => {
    // Arrange
    ;(Linking.parse as jest.Mock).mockReturnValue({ queryParams: {} })

    // Act
    const result = extractFriendIdFromUrl('betmates://invite')

    // Assert
    expect(result).toBeNull()
  })

  it('should return null when UUID is invalid', () => {
    // Arrange
    ;(Linking.parse as jest.Mock).mockReturnValue({ queryParams: { add: 'not-uuid' } })

    // Act
    const result = extractFriendIdFromUrl('betmates://invite?add=not-uuid')

    // Assert
    expect(result).toBeNull()
  })

  it('should validate likely UUID format correctly', () => {
    // Arrange
    const invalid = 'abc'

    // Act
    const validResult = isLikelyUserUuid(uuid)
    const invalidResult = isLikelyUserUuid(invalid)

    // Assert
    expect(validResult).toBe(true)
    expect(invalidResult).toBe(false)
  })
})
