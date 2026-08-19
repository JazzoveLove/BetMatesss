import { chainResponse } from '../helpers/supabaseMock'

import { supabase } from '@/shared/lib/supabase'
import { NotificationsService } from '@/shared/lib/notifications.service'

jest.mock('@/shared/lib/supabase', () => {
  const { createSupabaseMock } = require('../helpers/supabaseMock')
  return createSupabaseMock()
})

const mockFrom = supabase.from as jest.Mock

beforeEach(() => {
  mockFrom.mockReset()
})

function notificationRow(id: string, betId: string) {
  return {
    id,
    user_id: 'user-1',
    type: 'bet_invite',
    payload: { betId, fromUserId: 'user-2', fromNick: 'Kuba', gameTemplate: 'FIFA', stakeAmount: 10 },
    read: false,
    created_at: '2026-08-18T10:00:00Z',
  }
}

// Kontrakt: zwraca tylko zaproszenia, których zakład realnie istnieje, jest
// 'pending', a odbiorca jest jego niepotwierdzonym uczestnikiem. To jest
// treść fixu P0-1/P0-2 — te testy mają wyłapać regresję, gdyby ktoś wrócił
// do gołego selecta z notifications bez sprawdzania stanu zakładu.
describe('getPendingBetInviteNotifications', () => {
  it('happy path: zakład pending, uczestnik niepotwierdzony — zaproszenie na liście', async () => {
    mockFrom.mockReturnValueOnce(chainResponse({ data: [notificationRow('n1', 'b1')], error: null }))
    mockFrom.mockReturnValueOnce(chainResponse({ data: [{ id: 'b1' }], error: null }))
    mockFrom.mockReturnValueOnce(chainResponse({ data: [{ bet_id: 'b1' }], error: null }))

    const result = await NotificationsService.getPendingBetInviteNotifications('user-1')

    expect(result).toHaveLength(1)
    expect(result[0].betId).toBe('b1')
  })

  it('P0-1/P0-2: betId wskazuje na zakład, który nie istnieje albo nie jest pending — odfiltrowane bez pytania o bet_participants', async () => {
    mockFrom.mockReturnValueOnce(chainResponse({ data: [notificationRow('n1', 'b-deleted')], error: null }))
    mockFrom.mockReturnValueOnce(chainResponse({ data: [], error: null }))

    const result = await NotificationsService.getPendingBetInviteNotifications('user-1')

    expect(result).toEqual([])
  })

  it('uczestnik już potwierdził (np. z innego urządzenia) — zaproszenie odfiltrowane mimo że zakład wciąż pending', async () => {
    mockFrom.mockReturnValueOnce(chainResponse({ data: [notificationRow('n1', 'b1')], error: null }))
    mockFrom.mockReturnValueOnce(chainResponse({ data: [{ id: 'b1' }], error: null }))
    mockFrom.mockReturnValueOnce(chainResponse({ data: [], error: null }))

    const result = await NotificationsService.getPendingBetInviteNotifications('user-1')

    expect(result).toEqual([])
  })

  it('mix: dwa zaproszenia, jedno ważne jedno nie — zwraca tylko ważne', async () => {
    mockFrom.mockReturnValueOnce(
      chainResponse({ data: [notificationRow('n1', 'b1'), notificationRow('n2', 'b2')], error: null }),
    )
    mockFrom.mockReturnValueOnce(chainResponse({ data: [{ id: 'b1' }], error: null }))
    mockFrom.mockReturnValueOnce(chainResponse({ data: [{ bet_id: 'b1' }], error: null }))

    const result = await NotificationsService.getPendingBetInviteNotifications('user-1')

    expect(result.map(r => r.betId)).toEqual(['b1'])
  })

  it('uszkodzony payload (brak betId) — odfiltrowane na etapie mapowania, bez zapytania o bets', async () => {
    const broken = { id: 'n1', user_id: 'user-1', type: 'bet_invite', payload: { fromUserId: 'user-2' }, read: false, created_at: 'x' }
    mockFrom.mockReturnValueOnce(chainResponse({ data: [broken], error: null }))

    const result = await NotificationsService.getPendingBetInviteNotifications('user-1')

    expect(result).toEqual([])
  })

  it('pusta lista powiadomień — zwraca []', async () => {
    mockFrom.mockReturnValueOnce(chainResponse({ data: [], error: null }))

    const result = await NotificationsService.getPendingBetInviteNotifications('user-1')

    expect(result).toEqual([])
  })

  it('błąd zapytania do notifications — zwraca [] zamiast rzucać', async () => {
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: { message: 'DB error' } }))

    const result = await NotificationsService.getPendingBetInviteNotifications('user-1')

    expect(result).toEqual([])
  })
})
