import { getInitials } from '@/shared/utils/text'

describe('getInitials', () => {
  it('pusty string → "?"', () => {
    expect(getInitials('')).toBe('?')
  })

  it('jedno słowo, 1 znak → ta litera wielką', () => {
    expect(getInitials('a')).toBe('A')
  })

  it('jedno słowo, wiele znaków → pierwszy i ostatni znak', () => {
    expect(getInitials('Kuba')).toBe('KA')
  })

  // Regresja realnego buga: dwa różne nicki różniące się tylko końcówką
  // muszą dać różne inicjały (kolizja makaka1/makaka2 → oba 'MA', gdyby
  // funkcja brała np. dwie pierwsze litery zamiast pierwszej i ostatniej).
  it('nicki różniące się tylko końcówką (makaka1 / makaka2) dają różne inicjały', () => {
    const first = getInitials('makaka1')
    const second = getInitials('makaka2')

    expect(first).not.toBe(second)
    expect(first).toBe('M1')
    expect(second).toBe('M2')
  })

  it('dwa i więcej słów → pierwsza litera pierwszego + pierwsza litera ostatniego', () => {
    expect(getInitials('Jan Kowalski')).toBe('JK')
    expect(getInitials('Jan Maria Kowalski')).toBe('JK')
  })

  it('same spacje/whitespace → "?"', () => {
    expect(getInitials('   ')).toBe('?')
    expect(getInitials('\t\n')).toBe('?')
  })
})
