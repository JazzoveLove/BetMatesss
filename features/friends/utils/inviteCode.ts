const ALPH = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

export function generateInviteCode(length = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes)
    .map(b => ALPH[b % ALPH.length])
    .join('')
}