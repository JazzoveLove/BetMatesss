import { renderHook, act } from '@testing-library/react-native'
import { useBetDetailRealtime } from '@/features/bets/hooks/useBetDetailRealtime'
import { supabase } from '@/shared/lib/supabase'

jest.mock('@/shared/lib/supabase', () => {
  function makeChannel() {
    const channel: Record<string, any> = { _handlers: [] as { config: unknown; cb: (payload: unknown) => void }[] }
    channel.on = jest.fn((_event: string, config: unknown, cb: (payload: unknown) => void) => {
      channel._handlers.push({ config, cb })
      return channel
    })
    channel.subscribe = jest.fn(() => channel)
    return channel
  }
  return {
    supabase: {
      channel: jest.fn(() => makeChannel()),
      removeChannel: jest.fn(),
    },
  }
})

const mockChannelFn = supabase.channel as jest.Mock
const mockRemoveChannel = supabase.removeChannel as jest.Mock

let cleanup: (() => void) | null = null

beforeEach(() => {
  mockChannelFn.mockClear()
  mockRemoveChannel.mockClear()
})

afterEach(() => {
  cleanup?.()
  cleanup = null
})

type Channel = {
  on: jest.Mock
  subscribe: jest.Mock
  _handlers: { config: { event: string; schema: string; table: string; filter: string }; cb: (payload: unknown) => void }[]
}

function renderRealtime(betId: string, onUpdate: () => void) {
  const { unmount } = renderHook(() => useBetDetailRealtime(betId, onUpdate))
  cleanup = unmount
  const channels = mockChannelFn.mock.results.map(r => r.value as Channel)
  return { channels, unmount }
}

// Kluczowa uwaga o architekturze: hook NIE ma żadnego warunku porównującego
// betId w JS — cała ochrona "tylko zdarzenia dla tego zakładu" to string
// filter przekazywany do .on() (np. `bet_id=eq.${betId}`), ewaluowany po
// stronie Postgresa/Supabase. W testach jednostkowych nie da się uruchomić
// prawdziwego serwera realtime, więc jedyny sposób na sprawdzenie "inny
// betId nie dotrze do callbacka" to asercja na DOKŁADNEJ wartości tego
// stringa — nie symulacja dwóch payloadów z różnym bet_id (bo hook i tak
// wywołałby onUpdate dla obu, gdyby ktoś ręcznie strzelił w callback).
describe('useBetDetailRealtime — zakres subskrypcji (filter string)', () => {
  it('każdy kanał subskrybuje z filtrem ograniczonym do TEGO betId, nie do wszystkich zakładów', () => {
    const onUpdate = jest.fn()
    const { channels } = renderRealtime('bet-1', onUpdate)

    expect(channels).toHaveLength(4)
    const [participantsCh, betsCh, resultsCh, settlementsCh] = channels

    expect(participantsCh.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bet_participants', filter: 'bet_id=eq.bet-1' },
      expect.any(Function),
    )
    expect(betsCh.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'bets', filter: 'id=eq.bet-1' },
      expect.any(Function),
    )
    expect(resultsCh.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'bet_results', filter: 'bet_id=eq.bet-1' },
      expect.any(Function),
    )
    expect(resultsCh.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'bet_results', filter: 'bet_id=eq.bet-1' },
      expect.any(Function),
    )
    expect(settlementsCh.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'settlements', filter: 'bet_id=eq.bet-1' },
      expect.any(Function),
    )
    expect(settlementsCh.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'settlements', filter: 'bet_id=eq.bet-1' },
      expect.any(Function),
    )
  })

  it('inny betId → inny (odpowiednio przeskalowany) filter string, nie ten sam kanał / ten sam filtr', () => {
    const onUpdate = jest.fn()
    const { channels } = renderRealtime('bet-2', onUpdate)

    const [participantsCh] = channels
    const filterUsed = participantsCh.on.mock.calls[0][1].filter
    expect(filterUsed).toBe('bet_id=eq.bet-2')
    expect(filterUsed).not.toBe('bet_id=eq.bet-1')
  })
})

describe('useBetDetailRealtime — reakcja na zdarzenie', () => {
  it('zdarzenie z kanału tego zakładu → wywołuje onUpdate', () => {
    const onUpdate = jest.fn()
    const { channels } = renderRealtime('bet-1', onUpdate)
    const [participantsCh] = channels

    act(() => {
      participantsCh._handlers[0].cb({ new: { bet_id: 'bet-1' } })
    })

    expect(onUpdate).toHaveBeenCalledTimes(1)
  })
})

describe('useBetDetailRealtime — cleanup', () => {
  it('odpina wszystkie 4 kanały przy unmount', () => {
    const onUpdate = jest.fn()
    const { channels, unmount } = renderRealtime('bet-1', onUpdate)

    act(() => {
      unmount()
    })

    expect(mockRemoveChannel).toHaveBeenCalledTimes(4)
    for (const ch of channels) {
      expect(mockRemoveChannel).toHaveBeenCalledWith(ch)
    }
  })
})
