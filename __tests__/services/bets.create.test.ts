import { chainResponse } from '../helpers/supabaseMock'

jest.mock('@/shared/lib/supabase', () => {
  const { createSupabaseMock } = require('../helpers/supabaseMock')
  return createSupabaseMock()
})

jest.mock('../../services/notifications.service', () => ({
  NotificationsService: { sendBetInvite: jest.fn().mockResolvedValue({}) },
}))

import { supabase } from '@/shared/lib/supabase'
import { NotificationsService } from '../../services/notifications.service'
import { buildParticipantRows, createBet } from '../../services/bets/bets.create'
import type { CreateBetParams } from '../../types/bet.types'

const mockFrom = supabase.from as jest.Mock
const mockSendBetInvite = NotificationsService.sendBetInvite as jest.Mock

beforeEach(() => {
  mockFrom.mockReset()
  mockSendBetInvite.mockReset()
  mockSendBetInvite.mockResolvedValue({})
})

const baseParams = (
  overrides: Partial<Pick<CreateBetParams, 'stakeMode' | 'globalStake' | 'participants'>> = {},
): Pick<CreateBetParams, 'creatorId' | 'stakeMode' | 'globalStake' | 'participants'> => ({
  creatorId: 'user-1',
  stakeMode: 'equal',
  globalStake: 50,
  participants: [
    { id: 'user-1', nick: 'Ja', customStake: 0 },
    { id: 'user-2', nick: 'Rywal', customStake: 0 },
  ],
  ...overrides,
})

describe('buildParticipantRows', () => {
  it('tryb equal: obaj uczestnicy dostają stake_amount równy globalStake', () => {
    // Arrange
    const params = baseParams({ stakeMode: 'equal', globalStake: 50 })

    // Act
    const rows = buildParticipantRows('bet-1', params)

    // Assert
    expect(rows.map(r => r.stake_amount)).toEqual([50, 50])
  })

  it('tryb none: obaj uczestnicy dostają stake_amount = 0', () => {
    // Arrange
    const params = baseParams({ stakeMode: 'none', globalStake: 50 })

    // Act
    const rows = buildParticipantRows('bet-1', params)

    // Assert
    expect(rows.map(r => r.stake_amount)).toEqual([0, 0])
  })

  it('tryb custom: każdy dostaje swoją customStake', () => {
    // Arrange
    const params = baseParams({
      stakeMode: 'custom',
      participants: [
        { id: 'user-1', nick: 'Ja', customStake: 30 },
        { id: 'user-2', nick: 'Rywal', customStake: 70 },
      ],
    })

    // Act
    const rows = buildParticipantRows('bet-1', params)

    // Assert
    expect(rows.map(r => r.stake_amount)).toEqual([30, 70])
  })

  it('twórca dostaje role creator i confirmed true, przeciwnik role participant i confirmed false', () => {
    // Arrange
    const params = baseParams()

    // Act
    const rows = buildParticipantRows('bet-1', params)

    // Assert
    const creatorRow = rows.find(r => r.user_id === 'user-1')
    const opponentRow = rows.find(r => r.user_id === 'user-2')
    expect(creatorRow).toMatchObject({ role: 'creator', confirmed: true })
    expect(opponentRow).toMatchObject({ role: 'participant', confirmed: false })
  })

  it('wszystkie wiersze mają poprawny bet_id', () => {
    // Arrange
    const params = baseParams()

    // Act
    const rows = buildParticipantRows('bet-42', params)

    // Assert
    expect(rows.every(r => r.bet_id === 'bet-42')).toBe(true)
  })
})

describe('createBet', () => {
  const fullParams: CreateBetParams = {
    creatorId: 'user-1',
    gameTemplate: 'pilkarzyki',
    format: 'single',
    stakeMode: 'equal',
    participants: [
      { id: 'user-1', nick: 'Ja', customStake: 0 },
      { id: 'user-2', nick: 'Rywal', customStake: 0 },
    ],
    globalStake: 50,
  }

  it('zwraca { betId } gdy oba inserty (bets, bet_participants) się powiodą', async () => {
    // Arrange
    mockFrom.mockReturnValueOnce(chainResponse({ data: { id: 'bet-1' }, error: null }))
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: null }))

    // Act
    const result = await createBet(fullParams)

    // Assert
    expect(result).toEqual({ betId: 'bet-1' })
  })

  it('zwraca { error } gdy insert do bets się nie powiedzie', async () => {
    // Arrange
    mockFrom.mockReturnValueOnce(
      chainResponse({ data: null, error: { message: 'Nie udało się utworzyć zakładu.' } }),
    )

    // Act
    const result = await createBet(fullParams)

    // Assert
    expect(result).toEqual({ error: 'Nie udało się utworzyć zakładu.' })
  })

  it('zwraca { error } gdy insert do bet_participants się nie powiedzie', async () => {
    // Arrange
    mockFrom.mockReturnValueOnce(chainResponse({ data: { id: 'bet-1' }, error: null }))
    mockFrom.mockReturnValueOnce(chainResponse({ data: null, error: { message: 'insert failed' } }))

    // Act
    const result = await createBet(fullParams)

    // Assert
    expect(result).toEqual({ error: 'insert failed' })
    expect(mockSendBetInvite).not.toHaveBeenCalled()
  })
})
