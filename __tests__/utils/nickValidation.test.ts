jest.mock('@/shared/constants/user/bannedNickWords', () => ({
  BANNED_NICK_WORDS: ['zakazany'],
}))

import { nickSchema } from '@/shared/utils/user/nickValidation'

describe('nickSchema', () => {
  it('akceptuje poprawny nick mieszczący się w limicie długości', () => {
    const nick = 'Maciek'

    const result = nickSchema.safeParse(nick)

    expect(result.success).toBe(true)
  })

  it('odrzuca nick krótszy niż 5 znaków', () => {
    const nick = 'Ala'

    const result = nickSchema.safeParse(nick)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Nick musi mieć co najmniej 5 znaków.')
    }
  })

  it('odrzuca nick dłuższy niż 10 znaków', () => {
    const nick = 'BardzoDlugiNick'

    const result = nickSchema.safeParse(nick)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Nick może mieć maksymalnie 10 znaków.')
    }
  })

  it('odrzuca nick zawierający niedozwolone słowo', () => {
    const nick = 'tozakazany'

    const result = nickSchema.safeParse(nick)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Ten nick zawiera niedozwolone słowo.')
    }
  })
})
