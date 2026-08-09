import { DELETED_USER_NICK } from '@/shared/constants/user/deletedUser'

export function parseOddsNumber(value: number | string | undefined): number {
  if (value == null) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const n = Number(String(value).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export function normalizeUsersNick(raw: unknown): string | null {
  if (raw == null) return null
  const row = (Array.isArray(raw) ? raw[0] : raw) as { nick?: unknown; deleted_at?: unknown } | undefined
  if (!row) return null
  if (row.deleted_at != null) return DELETED_USER_NICK
  const n = row.nick
  return typeof n === 'string' && n.trim().length > 0 ? n.trim() : null
}
