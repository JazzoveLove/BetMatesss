const ALPH = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

export function generateInviteCode(length = 8): string {
  const max = 256 - (256 % ALPH.length)
  let result = ''
  while (result.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length - result.length))
    for (const b of bytes) {
      if (b < max) result += ALPH[b % ALPH.length]
    }
  }
  return result
}