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

export function createSupabaseMock() {
  return {
    supabase: {
      from: jest.fn(),
      rpc: jest.fn(),
    },
  }
}
