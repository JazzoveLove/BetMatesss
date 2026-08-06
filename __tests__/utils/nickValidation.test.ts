jest.mock('@/shared/constants/user/bannedNickWords', () => ({
  BANNED_NICK_WORDS: ['zakazany'],
}))

import { nickSchema } from '@/shared/utils/user/nickValidation'

describe('nickSchema', () => {
  it('akceptuje poprawny nick mieszczący się w limicie długości', () => {
    // Arrange
    const nick = 'Maciek'

    // Act
    const result = nickSchema.safeParse(nick)

    // Assert
    expect(result.success).toBe(true)
  })

  it('odrzuca nick krótszy niż 5 znaków', () => {
    // Arrange
    const nick = 'Ala'

    // Act
    const result = nickSchema.safeParse(nick)

    // Assert
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Nick musi mieć co najmniej 5 znaków.')
    }
  })

  it('odrzuca nick dłuższy niż 10 znaków', () => {
    // Arrange
    const nick = 'BardzoDlugiNick'

    // Act
    const result = nickSchema.safeParse(nick)

    // Assert
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Nick może mieć maksymalnie 10 znaków.')
    }
  })

  it('odrzuca nick zawierający niedozwolone słowo', () => {
    // Arrange
    const nick = 'tozakazany'

    // Act
    const result = nickSchema.safeParse(nick)

    // Assert
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Ten nick zawiera niedozwolone słowo.')
    }
  })
})
