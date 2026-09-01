import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

// Gwarancje żyjące wyłącznie w SQL (KROK 2.5b) — pinujemy obecność krytycznych
// predykatów w treści migracji. Zachowanie zweryfikowane lokalnie na
// postgres:16 (opis w PR); tu chronimy przed cichą regresją treści migracji.
const migrationsDir = join(__dirname, '../../supabase/migrations')

function migrationBodyContaining(marker: string): string {
  const hit = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()
    .map(f => readFileSync(join(migrationsDir, f), 'utf8'))
    .filter(content => content.includes(marker))
    .at(-1)
  if (!hit) throw new Error(`Nie znaleziono migracji z markerem: ${marker}`)
  return hit.replace(/^\s*--.*$/gm, '')
}

describe('migracja 20260902120000 — potwierdzanie spłat (BŁĄD-4 + 4b)', () => {
  const sql = migrationBodyContaining('function public.set_payment_status_on_insert')

  it('kolumna status z CHECK i DEFAULT confirmed (historyczne wiersze zostają potwierdzone)', () => {
    expect(sql).toMatch(/add column status text not null default 'confirmed'/)
    expect(sql).toMatch(/check \(status in \('pending', 'confirmed', 'rejected'\)\)/)
  })

  it('trigger BEFORE INSERT: wpis dłużnika → pending, wpis wierzyciela → confirmed', () => {
    expect(sql).toMatch(/before insert on public\.payments/)
    expect(sql).toMatch(/new\.from_user then[\s\S]*?new\.status\s*:=\s*'pending'/)
    expect(sql).toMatch(/else[\s\S]*?new\.status\s*:=\s*'confirmed'/)
  })

  it('trigger BEFORE UPDATE: biała lista pól + tylko pending → confirmed/rejected', () => {
    expect(sql).toMatch(/before update on public\.payments/)
    expect(sql).toMatch(/new\.amount is distinct from old\.amount/)
    expect(sql).toMatch(/new\.from_user is distinct from old\.from_user/)
    expect(sql).toMatch(/old\.status <> 'pending' or new\.status not in \('confirmed', 'rejected'\)/)
  })

  it('polityka UPDATE payments_confirm_or_reject: tylko to_user, tylko z pending', () => {
    expect(sql).toMatch(/create policy payments_confirm_or_reject on public\.payments for update/)
    expect(sql).toMatch(/\(select auth\.uid\(\)\)\s*=\s*to_user/)
    expect(sql).toMatch(/grant update on table public\.payments to authenticated/)
  })

  it('INSERT: blokada duplikatu wiszącej sprawy (E24) + backstop unikatem', () => {
    expect(sql).toMatch(/not public\.has_pending_payment_between\(payments\.from_user, payments\.to_user\)/)
    expect(sql).toMatch(/create unique index payments_one_pending_per_pair/)
    expect(sql).toMatch(/where status = 'pending' and deleted_at is null/)
  })

  it('delete_payment ZAOSTRZONE: created_by + status pending (pin BŁĘDU-4b)', () => {
    expect(sql).toMatch(/auth\.uid\(\) <> v_created_by/)
    expect(sql).toMatch(/v_status <> 'pending'/)
  })

  it('delete_my_account: wiszące spłaty z to_user = usuwający → rejected', () => {
    expect(sql).toMatch(
      /update public\.payments[\s\S]*?set status = 'rejected'[\s\S]*?where status = 'pending'[\s\S]*?and to_user = v_uid/,
    )
  })
})

describe('migracja 20260902120100 — saldo tylko z confirmed', () => {
  const sql = migrationBodyContaining('KROK 2.5b (ZADANIE 5)')

  it('wszystkie trzy funkcje salda dostają status = confirmed przy payments', () => {
    for (const fn of [
      'function public.get_pair_balance',
      'function public.get_balances_with_friends',
      'function public.get_balances_screen_data',
    ]) {
      expect(sql).toContain(fn)
    }
    // dwa wystąpienia w get_pair_balance + po jednym w pozostałych = min. 4
    expect(sql.match(/status = 'confirmed'/g)?.length ?? 0).toBeGreaterThanOrEqual(4)
  })
})
