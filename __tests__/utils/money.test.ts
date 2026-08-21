import { formatBalance, getBalanceColor } from '@/shared/utils/money'
import { Colors } from '@/shared/constants/colors'

describe('formatBalance', () => {
  it('wartość dodatnia → ze znakiem plus', () => {
    expect(formatBalance(50)).toBe('+50 j.')
  })

  it('wartość ujemna → minus z liczby, bez dodatkowego znaku', () => {
    expect(formatBalance(-30)).toBe('-30 j.')
  })

  it('zero → dokładnie "0 j.", nie "+0 j." ani "-0 j."', () => {
    expect(formatBalance(0)).toBe('0 j.')
  })
})

describe('getBalanceColor', () => {
  it('wartość dodatnia → zielony', () => {
    expect(getBalanceColor(50)).toBe(Colors.green)
  })

  it('wartość ujemna → czerwony', () => {
    expect(getBalanceColor(-30)).toBe(Colors.red)
  })

  it('zero → neutralny (Colors.textMuted)', () => {
    expect(getBalanceColor(0)).toBe(Colors.textMuted)
  })
})
