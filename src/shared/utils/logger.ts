import * as Sentry from '@sentry/react-native'

export function log(...args: unknown[]) {
  if (__DEV__) console.log(...args)
}

export function warn(...args: unknown[]) {
  if (__DEV__) console.warn(...args)
}

export function error(...args: unknown[]) {
  if (__DEV__) console.error(...args)

  const err = args.find((a): a is Error => a instanceof Error)
  if (err) {
    Sentry.captureException(err, { extra: { args } })
  } else {
    Sentry.captureMessage(
      args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '),
      { level: 'error', extra: { args } },
    )
  }
}
