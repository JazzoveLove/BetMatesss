import * as Linking from 'expo-linking'

export function isLikelyUserUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
}

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
    }
    trimmed = trimmed.trim()
    if (!isLikelyUserUuid(trimmed)) return null
    return trimmed
  } catch {
    return null
  }
}
