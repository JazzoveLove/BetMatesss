import failOnConsole from 'jest-fail-on-console'

failOnConsole()

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

// @sentry/react-native rejestruje setInterval (AsyncExpiringMap cleanup) przy
// samym imporcie — każdy test, który pośrednio importuje logger.ts, zostawia
// Jestowi otwarty handle ("did not exit one second after the test run") mimo
// że nie ma to nic wspólnego z testowaną logiką. Sentry i tak nie powinno nic
// realnie robić w środowisku testowym.
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  wrap: (component: unknown) => component,
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}))

jest.mock('@/shared/lib/supabase', () => {
  const channelBuilder: { on: jest.Mock; subscribe: jest.Mock } = {
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
