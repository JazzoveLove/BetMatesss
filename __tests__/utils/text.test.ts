import { getInitials, pluralize } from '@/shared/utils/text'

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

describe('pluralize', () => {
  const forms: [string, string, string] = ['mecz', 'mecze', 'meczów']

  it('1 → forma pojedyncza', () => {
    expect(pluralize(1, forms)).toBe('mecz')
  })

  it('2 → forma "kilka"', () => {
    expect(pluralize(2, forms)).toBe('mecze')
  })

  it('4 → forma "kilka"', () => {
    expect(pluralize(4, forms)).toBe('mecze')
  })

  it('5 → forma mnoga', () => {
    expect(pluralize(5, forms)).toBe('meczów')
  })

  // Pułapka nastek: 12 kończy się na "2", ale mieści się w wyjątku 11-14
  it('12 → forma mnoga (nastka, mimo końcówki 2)', () => {
    expect(pluralize(12, forms)).toBe('meczów')
  })

  it('22 → forma "kilka" (poza zakresem nastek)', () => {
    expect(pluralize(22, forms)).toBe('mecze')
  })

  it('25 → forma mnoga', () => {
    expect(pluralize(25, forms)).toBe('meczów')
  })
})
