export function log(...args: unknown[]) {
  if (__DEV__) console.log(...args)
}

export function warn(...args: unknown[]) {
  if (__DEV__) console.warn(...args)
}

export function error(...args: unknown[]) {
  if (__DEV__) console.error(...args)
}
