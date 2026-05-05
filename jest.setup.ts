const makeQueryBuilder = () => {
  const chain: Record<string, jest.Mock> = {}
  const methods = [
    'select',
    'eq',
    'in',
    'contains',
    'order',
    'limit',
    'update',
    'insert',
    'single',
    'maybeSingle',
    'returns',
    'subscribe',
    'on',
  ]

  methods.forEach(method => {
    chain[method] = jest.fn(() => chain)
  })

  return chain
}

jest.mock('./lib/supabase', () => {
  const channelBuilder = {
    on: jest.fn(() => channelBuilder),
    subscribe: jest.fn(() => channelBuilder),
  }

  return {
    supabase: {
      from: jest.fn(() => makeQueryBuilder()),
      channel: jest.fn(() => channelBuilder),
      removeChannel: jest.fn(),
    },
  }
})
