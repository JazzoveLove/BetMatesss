import * as Linking from 'expo-linking'

const BET_JOIN_PREFIX = 'join/'

export function buildBetInviteUrl(code: string): string {
  return `betmates://join/${code}`
}

export function getBetInviteCodeFromBetId(betId: string): string {
  return betId
}

export function parseBetIdFromInviteCode(code: string): string | null {
  const trimmed = code.trim()
  if (!trimmed) return null
  return trimmed
}

export function extractBetInviteCodeFromUrl(url: string): string | null {
  try {
    const parsed = Linking.parse(url)
    const host = (parsed.hostname ?? '').trim()
    const path = (parsed.path ?? '').trim()

    let codeCandidate = ''
    if (host === 'join' && path) {
      codeCandidate = path
    } else if (path.startsWith(BET_JOIN_PREFIX)) {
      codeCandidate = path.slice(BET_JOIN_PREFIX.length)
    } else {
      return null
    }

    const code = codeCandidate.trim()
    if (!code) return null
    return decodeURIComponent(code)
  } catch {
    return null
  }
}
