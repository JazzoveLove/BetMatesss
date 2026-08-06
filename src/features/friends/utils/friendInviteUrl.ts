import * as Linking from 'expo-linking'

/** Prosty test formatu UUID (v1–v5) — bez pełnej walidacji wersji. */
export function isLikelyUserUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
}

/** Z query ?add= wyciąga UUID użytkownika z linku zaproszenia. */
export function extractFriendIdFromUrl(url: string): string | null {
  try {
    const { queryParams } = Linking.parse(url)
    const raw = queryParams?.add
    const add = Array.isArray(raw) ? raw[0] : raw
    if (typeof add !== 'string') return null
    let trimmed = add.trim()
    try {
      trimmed = decodeURIComponent(trimmed)
    } catch {
      /* zostaw jak jest */
    }
    trimmed = trimmed.trim()
    if (!isLikelyUserUuid(trimmed)) return null
    return trimmed
  } catch {
    return null
  }
}
