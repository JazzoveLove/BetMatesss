#!/usr/bin/env node
/**
 * Testy RLS na lokalnej instancji Supabase (supabase start).
 *
 * Łączy się z lokalnym REST endpointem jako prawdziwi, zalogowani użytkownicy
 * (auth.signInWithPassword, prawdziwa sesja/JWT) i próbuje operacji, które
 * polityki RLS/triggery mają odrzucić. Fixtures (użytkownicy, zakłady,
 * znajomości, rozliczenia) są zakładane przez klienta service_role, który
 * omija RLS — sama akcja pod testem zawsze idzie przez klienta z realną
 * sesją zwykłego użytkownika.
 *
 * Wymaga `supabase start` (patrz README.md w tym katalogu). Nie jest częścią
 * `npm test` — uruchamiane osobno przez `npm run test:rls`.
 */

const { createClient } = require('@supabase/supabase-js')

// Standardowe, publicznie znane klucze demo dla lokalnego `supabase start`
// (ten sam JWT_SECRET dla każdej instalacji CLI, dopóki config.toml go nie
// nadpisze) — bezpieczne do zaszycia jako domyślne, bo działają wyłącznie
// przeciwko lokalnej bazie w Dockerze. Można nadpisać zmiennymi środowiskowymi.
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
const ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const results = []

function record(name, passed, detail) {
  results.push({ name, passed, detail })
  console.log(`${passed ? '✓ PASS' : '✗ FAIL'} — ${name}${detail ? `\n         ${detail}` : ''}`)
}

function admin() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function createTestUser(adminClient, label) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const email = `rls-${label}-${suffix}@example.com`
  const password = 'Test1234!'
  const nick = `rls_${label}_${suffix}`.slice(0, 30)

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw new Error(`createUser(${label}) failed: ${error.message}`)

  const userId = data.user.id
  const { error: profileError } = await adminClient.from('users').insert({ id: userId, nick })
  if (profileError) throw new Error(`insert profile(${label}) failed: ${profileError.message}`)

  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error: signInError } = await client.auth.signInWithPassword({ email, password })
  if (signInError) throw new Error(`signIn(${label}) failed: ${signInError.message}`)

  return { id: userId, client }
}

async function seedBet(adminClient, { creatorId, participantIds, status }) {
  const { data: bet, error: betError } = await adminClient
    .from('bets')
    .insert({
      creator_id: creatorId,
      game_template: 'FIFA',
      format: 'single',
      stake_mode: 'none',
      status,
    })
    .select('id')
    .single()
  if (betError) throw new Error(`seed bet failed: ${betError.message}`)

  for (const userId of participantIds) {
    const { error } = await adminClient.from('bet_participants').insert({
      bet_id: bet.id,
      user_id: userId,
      role: userId === creatorId ? 'creator' : 'participant',
      confirmed: true,
    })
    if (error) throw new Error(`seed bet_participants failed: ${error.message}`)
  }

  return bet.id
}

// [P1-1] Uczestnik zakładu nie może pominąć flow wyniku i ustawić status
// wprost na 'completed' — trigger prevent_bets_protected_field_change ma to
// zablokować, mimo że RLS (bets_update) w ogóle dopuszcza update tego wiersza
// przez uczestnika.
async function checkP1_1(adminClient) {
  const creator = await createTestUser(adminClient, 'p11-creator')
  const participant = await createTestUser(adminClient, 'p11-participant')
  const betId = await seedBet(adminClient, {
    creatorId: creator.id,
    participantIds: [creator.id, participant.id],
    status: 'active',
  })

  const { error } = await participant.client.from('bets').update({ status: 'completed' }).eq('id', betId)

  const rejected = Boolean(error)
  record(
    '[P1-1] uczestnik nie może ustawić bets.status=completed z pominięciem flow wyniku',
    rejected,
    rejected ? `odrzucone: ${error.message}` : 'BRAK BŁĘDU — update przeszedł, mimo że nie powinien',
  )
}

// [P0-3] Nadawca zaproszenia (user_a) nie może sam zaakceptować własnego
// zaproszenia — trigger prevent_friendships_protected_field_change wymaga,
// żeby pending -> accepted wykonał auth.uid() = user_b (odbiorca).
async function checkP0_3(adminClient) {
  const sender = await createTestUser(adminClient, 'p03-sender')
  const recipient = await createTestUser(adminClient, 'p03-recipient')

  const { data: friendship, error: seedError } = await adminClient
    .from('friendships')
    .insert({ user_a: sender.id, user_b: recipient.id, status: 'pending' })
    .select('id')
    .single()
  if (seedError) throw new Error(`seed friendship failed: ${seedError.message}`)

  const { error } = await sender.client
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendship.id)

  const rejected = Boolean(error)
  record(
    '[P0-3] nadawca zaproszenia nie może sam zaakceptować własnego zaproszenia',
    rejected,
    rejected ? `odrzucone: ${error.message}` : 'BRAK BŁĘDU — update przeszedł, mimo że nie powinien',
  )
}

// Użytkownik spoza rozliczenia/płatności nie widzi jej przez SELECT — RLS na
// SELECT ma zwrócić pustą tablicę, a nie błąd.
async function checkSettlementsAndPaymentsVisibility(adminClient) {
  const userA = await createTestUser(adminClient, 'vis-a')
  const userB = await createTestUser(adminClient, 'vis-b')
  const userC = await createTestUser(adminClient, 'vis-c')

  const betId = await seedBet(adminClient, {
    creatorId: userA.id,
    participantIds: [userA.id, userB.id],
    status: 'completed',
  })

  const { data: settlement, error: settlementSeedError } = await adminClient
    .from('settlements')
    .insert({ bet_id: betId, debtor_id: userA.id, creditor_id: userB.id, amount: 50 })
    .select('id')
    .single()
  if (settlementSeedError) throw new Error(`seed settlement failed: ${settlementSeedError.message}`)

  const { data: payment, error: paymentSeedError } = await adminClient
    .from('payments')
    .insert({ from_user: userA.id, to_user: userB.id, amount: 50, created_by: userA.id })
    .select('id')
    .single()
  if (paymentSeedError) throw new Error(`seed payment failed: ${paymentSeedError.message}`)

  const { data: settlementAsC, error: settlementSelectError } = await userC.client
    .from('settlements')
    .select('*')
    .eq('id', settlement.id)
  if (settlementSelectError) throw new Error(`select settlements as C errored (should return [], not throw): ${settlementSelectError.message}`)

  record(
    'user C nie widzi settlements między A i B (pusty wynik, nie błąd)',
    Array.isArray(settlementAsC) && settlementAsC.length === 0,
    `otrzymano ${settlementAsC ? settlementAsC.length : 'null'} wierszy`,
  )

  const { data: paymentAsC, error: paymentSelectError } = await userC.client
    .from('payments')
    .select('*')
    .eq('id', payment.id)
  if (paymentSelectError) throw new Error(`select payments as C errored (should return [], not throw): ${paymentSelectError.message}`)

  record(
    'user C nie widzi payments między A i B (pusty wynik, nie błąd)',
    Array.isArray(paymentAsC) && paymentAsC.length === 0,
    `otrzymano ${paymentAsC ? paymentAsC.length : 'null'} wierszy`,
  )
}

async function main() {
  const adminClient = admin()

  try {
    await adminClient.from('users').select('id').limit(1)
  } catch (e) {
    console.error(`Nie udało się połączyć z lokalnym Supabase pod ${SUPABASE_URL}.`)
    console.error('Uruchom najpierw: npx supabase start')
    throw e
  }

  await checkP1_1(adminClient)
  await checkP0_3(adminClient)
  await checkSettlementsAndPaymentsVisibility(adminClient)

  const failed = results.filter(r => !r.passed)
  console.log(`\n${results.length - failed.length}/${results.length} przeszło.`)

  if (failed.length > 0) {
    process.exitCode = 1
  }
}

main().catch(err => {
  console.error('\nBłąd w skrypcie testów RLS:', err)
  process.exitCode = 1
})
