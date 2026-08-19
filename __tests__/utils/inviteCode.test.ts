import { generateInviteCode } from '@/features/friends/utils/inviteCode'

const ALPH = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

describe('generateInviteCode', () => {
  it('generuje kod o dokładnej długości', () => {
    const code = generateInviteCode(8)

    expect(code).toHaveLength(8)
  })

  it('generuje kod o niestandardowej długości', () => {
    const code = generateInviteCode(12)

    expect(code).toHaveLength(12)
  })

  it('generuje kod zawierający wyłącznie znaki z alfabetu', () => {
    const code = generateInviteCode(64)

    expect(code.split('').every(char => ALPH.includes(char))).toBe(true)
  })

  it('rozkład znaków jest w rozsądnym zakresie odchylenia od równomiernego', () => {
    const sampleSize = 10000
    const codeLength = 8
    const counts = new Map<string, number>()

    for (let i = 0; i < sampleSize; i++) {
      const code = generateInviteCode(codeLength)
      for (const char of code) {
        counts.set(char, (counts.get(char) ?? 0) + 1)
      }
    }

    const totalChars = sampleSize * codeLength
    const expectedPerChar = totalChars / ALPH.length

    for (const char of ALPH) {
      const count = counts.get(char) ?? 0
      const deviation = Math.abs(count - expectedPerChar) / expectedPerChar
      expect(deviation).toBeLessThan(0.15)
    }
  })
})
