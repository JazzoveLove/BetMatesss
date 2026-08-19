type MockResult<T = unknown> = { data: T | null; error: any }

const CHAIN_METHODS = [
  'select',
  'eq',
  'or',
  'in',
  'is',
  'ilike',
  'gt',
  'order',
  'limit',
  'update',
  'insert',
  'delete',
  'overrideTypes',
  'maybeSingle',
  'single',
] as const

export function chainResponse<T = unknown>(result: MockResult<T>) {
  const node: Record<string, any> = {}
  CHAIN_METHODS.forEach(method => {
    node[method] = jest.fn(() => node)
  })
  node.then = (onFulfilled?: any, onRejected?: any) =>
    Promise.resolve(result).then(onFulfilled, onRejected)
  node.catch = (onRejected?: any) => Promise.resolve(result).catch(onRejected)
  return node
}

type Row = Record<string, any>

// Filtry, które faktycznie występują w src/features/*/api/*.ts (sprawdzone grepem).
// .or() nie jest wspierany — parsowanie dowolnego PostgREST or/and byłoby
// nieproporcjonalnym nakładem względem tego, co jest realnie potrzebne.
const UNSUPPORTED_MOCK_TABLE_FILTERS = ['or', 'ilike', 'neq', 'gte', 'lt', 'lte', 'not', 'contains', 'overlaps'] as const

/**
 * Jak chainResponse, ale zamiast zwracać gotową, zaszytą odpowiedź, przyjmuje
 * tablicę wierszy i realnie stosuje wywołane .eq()/.in()/.is()/.gt() na tych
 * danych. Dzięki temu test, który zmienia dane wejściowe, faktycznie zmienia
 * wynik — w przeciwieństwie do chainResponse, gdzie .eq() itp. są atrapami
 * zwracającymi siebie i nic nie filtrują.
 *
 * Wywołanie filtra, którego mockTable nie obsługuje, rzuca błędem zamiast
 * cicho przepuszczać wszystkie wiersze — to celowe, żeby brak pokrycia był
 * widoczny w teście, a nie ukryty jako fałszywie pozytywny wynik.
 */
export function mockTable<T extends Row = Row>(data: T[]) {
  let rows: T[] = [...data]
  let mode: 'list' | 'single' | 'maybeSingle' = 'list'

  const node: Record<string, any> = {}

  node.select = jest.fn(() => node)
  node.overrideTypes = jest.fn(() => node)

  node.eq = jest.fn((column: string, value: unknown) => {
    rows = rows.filter(row => row[column] === value)
    return node
  })
  node.in = jest.fn((column: string, values: unknown[]) => {
    rows = rows.filter(row => values.includes(row[column]))
    return node
  })
  node.is = jest.fn((column: string, value: unknown) => {
    rows = rows.filter(row => row[column] === value)
    return node
  })
  node.gt = jest.fn((column: string, value: number) => {
    rows = rows.filter(row => row[column] > value)
    return node
  })
  node.order = jest.fn((column: string, opts?: { ascending?: boolean }) => {
    const ascending = opts?.ascending ?? true
    rows = [...rows].sort((a, b) => {
      if (a[column] === b[column]) return 0
      return (a[column] > b[column] ? 1 : -1) * (ascending ? 1 : -1)
    })
    return node
  })
  node.limit = jest.fn((count: number) => {
    rows = rows.slice(0, count)
    return node
  })
  node.single = jest.fn(() => {
    mode = 'single'
    return node
  })
  node.maybeSingle = jest.fn(() => {
    mode = 'maybeSingle'
    return node
  })

  UNSUPPORTED_MOCK_TABLE_FILTERS.forEach(method => {
    node[method] = jest.fn(() => {
      throw new Error(
        `mockTable: .${method}() nie jest wspierany. Dodaj obsługę w __tests__/helpers/supabaseMock.ts albo użyj chainResponse() dla tego zapytania.`,
      )
    })
  })

  function resolve(): MockResult<T | T[]> {
    if (mode === 'single') {
      if (rows.length !== 1) return { data: null, error: { message: 'single(): expected exactly one row' } }
      return { data: rows[0], error: null }
    }
    if (mode === 'maybeSingle') {
      if (rows.length > 1) return { data: null, error: { message: 'maybeSingle(): expected at most one row' } }
      return { data: rows[0] ?? null, error: null }
    }
    return { data: rows, error: null }
  }

  node.then = (onFulfilled?: any, onRejected?: any) => Promise.resolve(resolve()).then(onFulfilled, onRejected)
  node.catch = (onRejected?: any) => Promise.resolve(resolve()).catch(onRejected)

  return node
}

export function createSupabaseMock() {
  return {
    supabase: {
      from: jest.fn(),
      rpc: jest.fn(),
    },
  }
}
