export function log(...args: unknown[]) {
    if (__DEV__) console.log(...args)
  }
  
  export function warn(...args: unknown[]) {
    if (__DEV__) console.warn(...args)
  }