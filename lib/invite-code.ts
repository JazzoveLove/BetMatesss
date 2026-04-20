const ALPH = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

/** Krótki kod do ręcznego wpisania (bez 0/O/1/I). */
export function generateInviteCode(length = 8): string {
  let s = ''
  for (let i = 0; i < length; i++) {
    s += ALPH[Math.floor(Math.random() * ALPH.length)]
  }
  return s
}
