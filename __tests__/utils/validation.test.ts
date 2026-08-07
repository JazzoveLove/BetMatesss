import { z } from 'zod'
import { getFirstValidationError } from '@/shared/utils/validation'

const schema = z.string().min(3, 'Za krótkie.')

describe('getFirstValidationError', () => {
  it('zwraca null gdy walidacja się powiodła', () => {
    const result = schema.safeParse('abc')

    const error = getFirstValidationError(result)

    expect(error).toBeNull()
  })

  it('zwraca pierwszy komunikat błędu gdy walidacja się nie powiodła', () => {
    const result = schema.safeParse('ab')

    const error = getFirstValidationError(result)

    expect(error).toBe('Za krótkie.')
  })
})
