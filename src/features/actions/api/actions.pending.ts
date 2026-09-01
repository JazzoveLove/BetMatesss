import { supabase } from '@/shared/lib/supabase'
import { mapUserProfileRow } from '@/shared/utils/mappers'
import type { UserProfile, UserProfileRow } from '@/shared/types/user.types'
import type { PendingAction, PendingActionKind } from '@/features/actions/types/action.types'

type PendingActionRpcRow = {
  kind: PendingActionKind
  bet_id: string | null
  payment_id: string | null
  other_id: string | null
  game_template: string | null
  stake: number | string | null
  created_at: string | null
}

/**
 * Profile drugiej strony spraw. Fail-OPEN: błąd/brak wiersza nie może ukryć
 * sprawy — sprawa bez nicku jest ok, brakująca sprawa nie. (Fail-closed dotyczy
 * wyłącznie samego RPC — patrz getPendingActions.)
 */
async function loadProfilesByIds(ids: string[]): Promise<Map<string, UserProfile>> {
  const uniq = [...new Set(ids)].filter(Boolean)
  if (uniq.length === 0) return new Map()

  const { data, error } = await supabase
    .from('users')
    .select('id, nick, avatar_url, invite_code, created_at, deleted_at')
    .in('id', uniq)
  if (error || !data) return new Map()

  return new Map((data as UserProfileRow[]).map(row => [row.id, mapUserProfileRow(row)]))
}

/**
 * Wzorzec jak getBalancesScreenData: wywołaj RPC, dociągnij profile drugiej
 * strony osobnym zapytaniem po id, zmapuj snake_case → camelCase istniejącym
 * mapperem. Sterujemy listą wierszami RPC (nie listą znajomych) — druga strona
 * sporu mogła przestać być znajomym / usunąć konto i sprawa nadal musi się
 * pokazać.
 */
export async function getPendingActions(viewerId: string): Promise<PendingAction[]> {
  const { data, error } = await supabase.rpc('get_pending_actions', { p_viewer: viewerId })
  // Fail-closed: błąd RPC leci wyżej (hook → isError). Pusta lista NIE, bo
  // udawałaby "wszystko ogarnięte", a to sprawy finansowe.
  if (error) throw error

  const rows = (data ?? []) as PendingActionRpcRow[]

  const profiles = await loadProfilesByIds(
    rows.map(r => r.other_id).filter((id): id is string => !!id),
  )

  const seenKeys = new Set<string>()
  const out: PendingAction[] = []

  for (const row of rows) {
    // Klucz sprawy = bet_id ALBO payment_id (payment_confirm nie ma bet_id).
    // To samo wyrażenie, po którym dedupuje SQL (coalesce(bet_id, payment_id)).
    // Jedna sprawa = jeden wiersz; duplikat na tym poziomie objawiłby się
    // licznikiem "(5)" przy 3 realnych sprawach — taniej domknąć tu niż w UI.
    const key = row.bet_id ?? row.payment_id
    if (key) {
      if (seenKeys.has(key)) continue
      seenKeys.add(key)
    }

    const profile = row.other_id ? profiles.get(row.other_id) : undefined

    out.push({
      kind: row.kind,
      betId: row.bet_id,
      paymentId: row.payment_id ?? null,
      otherId: row.other_id,
      // Ten sam fallback co getPairDetail (friendDetail.queries.ts) dla drugiej
      // strony, której profilu nie da się ustalić — spójna etykieta zamiast
      // pustego miejsca obok sprawy.
      otherNickname: profile?.nick ?? 'Znajomy',
      otherAvatarUrl: profile?.avatarUrl ?? null,
      gameTemplate: row.game_template,
      stake: row.stake === null || row.stake === undefined ? null : Number(row.stake),
      createdAt: row.created_at,
    })
  }

  return out
}
