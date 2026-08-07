import { getAvailableFormats, getDefaultFormat } from '@/features/bets/utils/formats'
import { GAME_TEMPLATES } from '@/shared/constants/games'

const dart = GAME_TEMPLATES.find(g => g.id === 'dart')!
const tenis = GAME_TEMPLATES.find(g => g.id === 'tenis')!
const pilkarzyki = GAME_TEMPLATES.find(g => g.id === 'pilkarzyki')!

describe('getAvailableFormats', () => {
  it('zwraca tylko "single" dla darta, mimo że jego defaultFormat to best_of', () => {
    const formats = getAvailableFormats(dart, 1)

    expect(formats).toEqual(['single'])
  })

  it('zwraca tylko "single" dla tenisa, mimo że jego defaultFormat to best_of', () => {
    const formats = getAvailableFormats(tenis, 1)

    expect(formats).toEqual(['single'])
  })

  it('nigdy nie zwraca formatu spoza ENABLED_FORMATS, nawet przy liczbie graczy odblokowującej inne formaty', () => {
    const formats = getAvailableFormats(dart, 3)

    expect(formats).toEqual(['single'])
  })
})

describe('getDefaultFormat', () => {
  it('zwraca "single" dla gry z defaultFormat "single" (piłkarzyki)', () => {
    const format = getDefaultFormat(pilkarzyki, 1)

    expect(format).toBe('single')
  })

  it('zwraca "single" dla darta, mimo że jego defaultFormat to best_of (best_of wyłączony w ENABLED_FORMATS)', () => {
    const format = getDefaultFormat(dart, 1)

    expect(format).toBe('single')
  })

  it('zwraca "single" dla tenisa, mimo że jego defaultFormat to best_of (best_of wyłączony w ENABLED_FORMATS)', () => {
    const format = getDefaultFormat(tenis, 1)

    expect(format).toBe('single')
  })
})
