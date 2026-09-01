import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { chainResponse } from '../helpers/supabaseMock'

import { supabase } from '@/shared/lib/supabase'
import { getPendingActions } from '@/features/actions/api/actions.pending'

jest.mock('@/shared/lib/supabase', () => {
  const { createSupabaseMock } = require('../helpers/supabaseMock')
  return createSupabaseMock()
})

const mockRpc = supabase.rpc as jest.Mock
const mockFrom = supabase.from as jest.Mock

beforeEach(() => {
  mockRpc.mockReset()
  mockFrom.mockReset()
})

function profileRow(id: string, nick: string, avatar_url: string | null = null, deleted_at: string | null = null) {
  return { id, nick, avatar_url, invite_code: null, created_at: null, deleted_at }
}

describe('getPendingActions — mapowanie i wzbogacanie', () => {
  it('mapuje snake_case → camelCase i dokleja nick/avatar drugiej strony po id', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [
        {
          kind: 'result_confirm',
          bet_id: 'bet-1',
          other_id: 'user-2',
          game_template: 'pilkarzyki',
          stake: 10,
          created_at: '2026-08-20T10:00:00.000Z',
        },
      ],
      error: null,
    })
    mockFrom.mockReturnValueOnce(
      chainResponse({ data: [profileRow('user-2', 'Kuba', 'https://x/kuba.png')], error: null }),
    )

    const result = await getPendingActions('user-1')

    expect(result).toEqual([
      {
        kind: 'result_confirm',
        betId: 'bet-1',
        paymentId: null,
        otherId: 'user-2',
        otherNickname: 'Kuba',
        otherAvatarUrl: 'https://x/kuba.png',
        gameTemplate: 'pilkarzyki',
        stake: 10,
        createdAt: '2026-08-20T10:00:00.000Z',
      },
    ])
  })

  it('payment_confirm: bet_id NULL, payment_id ustawione, game_template NULL, stake = kwota spłaty', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [
        {
          kind: 'payment_confirm',
          bet_id: null,
          payment_id: 'pay-1',
          other_id: 'user-2',
          game_template: null,
          stake: 40,
          created_at: '2026-08-25T09:00:00.000Z',
        },
      ],
      error: null,
    })
    mockFrom.mockReturnValueOnce(chainResponse({ data: [profileRow('user-2', 'Kuba')], error: null }))

    const result = await getPendingActions('user-1')

    expect(result).toEqual([
      {
        kind: 'payment_confirm',
        betId: null,
        paymentId: 'pay-1',
        otherId: 'user-2',
        otherNickname: 'Kuba',
        otherAvatarUrl: null,
        gameTemplate: null,
        stake: 40,
        createdAt: '2026-08-25T09:00:00.000Z',
      },
    ])
  })

  it('dwie wiszące spłaty (bet_id NULL, różne payment_id) → NIE zwijają się w jeden wiersz', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [
        { kind: 'payment_confirm', bet_id: null, payment_id: 'pay-1', other_id: 'user-2', game_template: null, stake: 10, created_at: '2026-08-25T09:00:00.000Z' },
        { kind: 'payment_confirm', bet_id: null, payment_id: 'pay-2', other_id: 'user-3', game_template: null, stake: 20, created_at: '2026-08-24T09:00:00.000Z' },
      ],
      error: null,
    })
    mockFrom.mockReturnValueOnce(
      chainResponse({ data: [profileRow('user-2', 'Kuba'), profileRow('user-3', 'Ala')], error: null }),
    )

    const result = await getPendingActions('user-1')

    expect(result.map(a => a.paymentId)).toEqual(['pay-1', 'pay-2'])
  })

  it('stake numeryczny jako string z RPC → number; null zostaje null (stake_mode=none)', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [
        { kind: 'bet_invite', bet_id: 'bet-1', other_id: 'user-2', game_template: 'tenis', stake: '25', created_at: null },
        { kind: 'dispute', bet_id: 'bet-2', other_id: 'user-3', game_template: 'szachy', stake: null, created_at: null },
      ],
      error: null,
    })
    mockFrom.mockReturnValueOnce(
      chainResponse({ data: [profileRow('user-2', 'Kuba'), profileRow('user-3', 'Ala')], error: null }),
    )

    const result = await getPendingActions('user-1')

    expect(result.map(a => a.stake)).toEqual([25, null])
    expect(typeof result[0].stake).toBe('number')
  })

  it('deleted_at drugiej strony → nick to DELETED_USER_NICK, nie prawdziwy', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [{ kind: 'dispute', bet_id: 'bet-1', other_id: 'user-2', game_template: 'x', stake: null, created_at: null }],
      error: null,
    })
    mockFrom.mockReturnValueOnce(
      chainResponse({ data: [profileRow('user-2', 'PrawdziwyNick', null, '2026-01-01T00:00:00Z')], error: null }),
    )

    const result = await getPendingActions('user-1')

    expect(result[0].otherNickname).toBe('Usunięty użytkownik')
  })

  it('brak profilu drugiej strony (np. niewidoczny) → sprawa NADAL się pokazuje, fallback nicku', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [{ kind: 'dispute', bet_id: 'bet-1', other_id: 'user-2', game_template: 'x', stake: null, created_at: null }],
      error: null,
    })
    mockFrom.mockReturnValueOnce(chainResponse({ data: [], error: null }))

    const result = await getPendingActions('user-1')

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ betId: 'bet-1', otherNickname: 'Znajomy', otherAvatarUrl: null })
  })

  it('błąd zapytania o profile NIE ukrywa spraw (fail-open na profilach)', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [{ kind: 'dispute', bet_id: 'bet-1', other_id: 'user-2', game_template: 'x', stake: null, created_at: null }],
      error: null,
    })
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: { message: 'boom' } }))

    const result = await getPendingActions('user-1')

    expect(result).toHaveLength(1)
    expect(result[0].otherNickname).toBe('Znajomy')
  })
})

describe('getPendingActions — jedna sprawa = jeden wiersz', () => {
  it('ten sam bet_id dwa razy w odpowiedzi RPC → jeden wiersz na wyjściu', async () => {
    // Gdyby RPC (błędnie) zwróciło zakład wielokrotnie — np. przez > 2
    // uczestników — mapper i tak zwija do jednego wiersza. To pilnuje regresu
    // "licznik (5) przy 3 realnych sprawach".
    mockRpc.mockResolvedValueOnce({
      data: [
        { kind: 'dispute', bet_id: 'bet-1', other_id: 'user-2', game_template: 'x', stake: null, created_at: '2026-08-20T10:00:00.000Z' },
        { kind: 'dispute', bet_id: 'bet-1', other_id: 'user-3', game_template: 'x', stake: null, created_at: '2026-08-20T10:00:00.000Z' },
      ],
      error: null,
    })
    mockFrom.mockReturnValueOnce(
      chainResponse({ data: [profileRow('user-2', 'Kuba'), profileRow('user-3', 'Ala')], error: null }),
    )

    const result = await getPendingActions('user-1')

    expect(result).toHaveLength(1)
    expect(result[0].betId).toBe('bet-1')
    expect(result[0].otherId).toBe('user-2')
  })
})

describe('getPendingActions — fail-closed na RPC', () => {
  it('błąd RPC jest rzucany dalej (NIE pusta lista)', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'rpc down' } })

    await expect(getPendingActions('user-1')).rejects.toEqual({ message: 'rpc down' })
    // profile nie są nawet dociągane, gdy RPC padło
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('pusta odpowiedź RPC → pusta lista, bez wysypki i bez zapytania o profile', async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null })

    const result = await getPendingActions('user-1')

    expect(result).toEqual([])
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('data === null przy braku błędu → pusta lista', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null })

    const result = await getPendingActions('user-1')

    expect(result).toEqual([])
  })
})

// Gwarancje żyjące wyłącznie w SQL — nie da się ich wykonać bez bazy, więc
// pinujemy obecność kluczowych predykatów w treści migracji. Zachowanie
// weryfikujemy świadomie na prawdziwej bazie przy review PR-a (tak jak przy
// get_match_counts_with_friends).
describe('migracja get_pending_actions — predykaty krytyczne w SQL', () => {
  // Nie zaszywamy nazwy pliku — migracje bywają konsolidowane do baseline
  // (patrz *_consolidated_into_baseline.sql). Szukamy pliku po zawartości.
  const migrationsDir = join(__dirname, '../../supabase/migrations')
  // get_pending_actions definiują DWIE migracje (20260829120000 tworzy,
  // 20260902120200 robi DROP + CREATE z payment_id). Sortujemy nazwy i bierzemy
  // OSTATNIE trafienie — inaczej test mógłby pinować martwą, nieaktualną wersję.
  const sql = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()
    .map(f => readFileSync(join(migrationsDir, f), 'utf8'))
    .filter(content => content.includes('function public.get_pending_actions'))
    .at(-1)

  if (!sql) throw new Error('Nie znaleziono migracji definiującej get_pending_actions')

  // Komentarze opisują wzorzec ("bez security definer"), więc predykaty
  // sprawdzamy na treści bez linii `-- ...`.
  const sqlBody = sql.replace(/^\s*--.*$/gm, '')

  it('result_confirm odcina osobę, która sama wpisała wynik (recorded_by <> p_viewer)', () => {
    expect(sqlBody).toMatch(/r\.recorded_by\s*<>\s*p_viewer/)
  })

  it('result_confirm bierze tylko niepotwierdzone wyniki (r.confirmed = false)', () => {
    expect(sqlBody).toMatch(/r\.confirmed\s*=\s*false/)
  })

  it('bet_invite bierze tylko niepotwierdzony udział p_viewera (bp_me.confirmed = false)', () => {
    expect(sqlBody).toMatch(/bp_me\.confirmed\s*=\s*false/)
  })

  it('trzy rozłączne statusy bets, po jednym na gałąź UNION', () => {
    expect(sqlBody).toMatch(/b\.status\s*=\s*'pending'/)
    expect(sqlBody).toMatch(/b\.status\s*=\s*'awaiting_confirmation'/)
    expect(sqlBody).toMatch(/b\.status\s*=\s*'disputed'/)
  })

  it('dedup po kluczu sprawy coalesce(bet_id, payment_id) i sort z NULL na końcu', () => {
    expect(sqlBody).toMatch(/distinct on \(coalesce\(u\.bet_id,\s*u\.payment_id\)\)/)
    expect(sqlBody).toMatch(/order by dedup\.created_at desc nulls last/)
  })

  it('czwarty typ sprawy: payment_confirm — wisząca spłata do wierzyciela (p_viewer = to_user)', () => {
    expect(sqlBody).toMatch(/'payment_confirm'::text\s+as kind/)
    expect(sqlBody).toMatch(/pay\.status\s*=\s*'pending'/)
    expect(sqlBody).toMatch(/pay\.to_user\s*=\s*p_viewer/)
    expect(sqlBody).toMatch(/pay\.deleted_at is null/)
  })

  it('nowa kolumna payment_id w typie zwracanym (bet_id NULL dla payment_confirm)', () => {
    expect(sqlBody).toMatch(/payment_id uuid/)
  })

  it('zmiana typu zwracanego przez DROP + CREATE, nie CREATE OR REPLACE', () => {
    expect(sqlBody).toMatch(/drop function if exists public\.get_pending_actions\(uuid\)/)
  })

  it('INVOKER — brak security definer; grant execute tylko dla authenticated', () => {
    expect(sqlBody).not.toMatch(/security\s+definer/i)
    expect(sqlBody).toMatch(/set search_path to 'public', 'pg_temp'/)
    expect(sqlBody).toMatch(/revoke all on function public\.get_pending_actions\(uuid\) from public/)
    expect(sqlBody).toMatch(/revoke all on function public\.get_pending_actions\(uuid\) from anon/)
    expect(sqlBody).toMatch(/grant execute on function public\.get_pending_actions\(uuid\) to authenticated/)
  })
})
