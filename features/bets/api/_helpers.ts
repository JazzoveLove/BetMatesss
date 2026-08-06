export function parseOddsNumber(value: number | string | undefined): number {
  if (value == null) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const n = Number(String(value).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export function normalizeUsersNick(raw: unknown): string | null {
  if (raw == null) return null
  if (Array.isArray(raw)) {
    const first = raw[0] as { nick?: unknown } | undefined
    const n = first?.nick
    return typeof n === 'string' && n.trim().length > 0 ? n.trim() : null
  }
  const n = (raw as { nick?: unknown }).nick
  return typeof n === 'string' && n.trim().length > 0 ? n.trim() : null
}
