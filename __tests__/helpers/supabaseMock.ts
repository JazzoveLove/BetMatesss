type MockResult<T = unknown> = { data: T | null; error: any }

const CHAIN_METHODS = [
  'select',
  'eq',
  'or',
  'in',
  'is',
  'ilike',
  'limit',
  'update',
  'insert',
  'delete',
  'overrideTypes',
  'maybeSingle',
] as const

/**
 * Buduje "chainable" węzeł mockujący query builder Supabase: każda metoda
 * z CHAIN_METHODS zwraca ten sam obiekt (żeby łańcuch wywołań działał),
 * a sam obiekt jest thenable i rozwiązuje się do zadanej odpowiedzi
 * niezależnie od tego, w którym miejscu łańcucha zostanie zawołany `await`.
 */
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

export function createSupabaseMock() {
  return {
    supabase: {
      from: jest.fn(),
      rpc: jest.fn(),
    },
  }
}
