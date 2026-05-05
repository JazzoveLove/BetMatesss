import { generateInviteCode } from '../../lib/invite-code'

describe('generateInviteCode', () => {
  it('should return code with default length of 8 characters', () => {
    // Arrange
    const randomSpy = jest.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(arr => arr)

    // Act
    const code = generateInviteCode()

    // Assert
    expect(code).toHaveLength(8)
    randomSpy.mockRestore()
  })

  it('should return code with provided custom length', () => {
    // Arrange
    const randomSpy = jest.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(arr => arr)

    // Act
    const code = generateInviteCode(12)

    // Assert
    expect(code).toHaveLength(12)
    randomSpy.mockRestore()
  })

  it('should generate URL-safe uppercase characters only', () => {
    // Arrange
    const randomSpy = jest.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(arr => arr)

    // Act
    const code = generateInviteCode(10)

    // Assert
    expect(code).toMatch(/^[2-9A-Z]+$/)
    randomSpy.mockRestore()
  })

  it('should produce different-looking codes for different random bytes', () => {
    // Arrange
    const randomSpy = jest.spyOn(globalThis.crypto, 'getRandomValues')
    randomSpy
      .mockImplementationOnce(arr => {
        arr.fill(0)
        return arr
      })
      .mockImplementationOnce(arr => {
        arr.fill(7)
        return arr
      })

    // Act
    const codeA = generateInviteCode(8)
    const codeB = generateInviteCode(8)

    // Assert
    expect(codeA).not.toBe(codeB)
    randomSpy.mockRestore()
  })

  it('should return empty string when requested length is zero', () => {
    // Arrange
    const randomSpy = jest.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(arr => arr)

    // Act
    const code = generateInviteCode(0)

    // Assert
    expect(code).toBe('')
    randomSpy.mockRestore()
  })
})
