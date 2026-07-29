import { z } from 'zod'
import { getFirstValidationError } from '../../utils/validation'

const schema = z.string().min(3, 'Za krótkie.')

describe('getFirstValidationError', () => {
  it('zwraca null gdy walidacja się powiodła', () => {
    // Arrange
    const result = schema.safeParse('abc')

    // Act
    const error = getFirstValidationError(result)

    // Assert
    expect(error).toBeNull()
  })

  it('zwraca pierwszy komunikat błędu gdy walidacja się nie powiodła', () => {
    // Arrange
    const result = schema.safeParse('ab')

    // Act
    const error = getFirstValidationError(result)

    // Assert
    expect(error).toBe('Za krótkie.')
  })
})
