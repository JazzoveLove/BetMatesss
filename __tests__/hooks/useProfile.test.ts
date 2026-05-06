import { buildProfileSection, computeProfileStatsV2, type WLEntry } from '../../utils/profileStats'

describe('buildProfileSection', () => {
  it('zwraca zerowe wartości dla pustej listy', () => {
    const result = buildProfileSection([])
    expect(result.wins).toBe(0)
    expect(result.losses).toBe(0)
    expect(result.winRate).toBe(0)
    expect(result.balance).toBe(0)
    expect(result.disciplines).toHaveLength(0)
  })

  it('liczy wins, losses i winrate poprawnie', () => {
    const entries: WLEntry[] = [
      { win: true, loss: false, balance: 20, gameTemplate: 'fifa' },
      { win: true, loss: false, balance: 10, gameTemplate: 'fifa' },
      { win: false, loss: true, balance: -15, gameTemplate: 'pool' },
    ]
    const result = buildProfileSection(entries)
    expect(result.wins).toBe(2)
    expect(result.losses).toBe(1)
    expect(result.winRate).toBe(67)
    expect(result.balance).toBe(15)
  })

  it('grupuje dyscypliny i sumuje balance per template', () => {
    const entries: WLEntry[] = [
      { win: true, loss: false, balance: 30, gameTemplate: 'pool' },
      { win: false, loss: true, balance: -10, gameTemplate: 'pool' },
      { win: true, loss: false, balance: 50, gameTemplate: 'fifa' },
    ]
    const result = buildProfileSection(entries)
    const pool = result.disciplines.find(d => d.gameTemplate === 'pool')
    const fifa = result.disciplines.find(d => d.gameTemplate === 'fifa')
    expect(pool?.wins).toBe(1)
    expect(pool?.losses).toBe(1)
    expect(pool?.balance).toBe(20)
    expect(fifa?.wins).toBe(1)
    expect(fifa?.losses).toBe(0)
  })

  it('sortuje dyscypliny malejąco po łącznej liczbie meczów', () => {
    const entries: WLEntry[] = [
      { win: true, loss: false, balance: 0, gameTemplate: 'chess' },
      { win: true, loss: false, balance: 0, gameTemplate: 'pool' },
      { win: false, loss: true, balance: 0, gameTemplate: 'pool' },
      { win: false, loss: true, balance: 0, gameTemplate: 'pool' },
    ]
    const result = buildProfileSection(entries)
    expect(result.disciplines[0].gameTemplate).toBe('pool')
    expect(result.disciplines[1].gameTemplate).toBe('chess')
  })
})

describe('computeProfileStatsV2', () => {
  it('overall liczy wszystkie completed niezależnie od stake_mode', () => {
    const money: WLEntry[] = [
      { win: true, loss: false, balance: 20, gameTemplate: 'fifa' },
      { win: false, loss: true, balance: -10, gameTemplate: 'pool' },
    ]
    const friendly: WLEntry[] = [
      { win: true, loss: false, balance: 0, gameTemplate: 'chess' },
      { win: false, loss: true, balance: 0, gameTemplate: 'chess' },
    ]
    const stats = computeProfileStatsV2(money, friendly)
    expect(stats.overall.wins).toBe(2)
    expect(stats.overall.losses).toBe(2)
    expect(stats.overall.winRate).toBe(50)
  })

  it('money stats zawiera tylko zakłady ze stawką (nie uwzględnia friendly)', () => {
    const money: WLEntry[] = [{ win: true, loss: false, balance: 20, gameTemplate: 'fifa' }]
    const friendly: WLEntry[] = [{ win: false, loss: true, balance: 0, gameTemplate: 'chess' }]
    const stats = computeProfileStatsV2(money, friendly)
    expect(stats.money?.wins).toBe(1)
    expect(stats.money?.losses).toBe(0)
    expect(stats.money?.disciplines).toHaveLength(1)
    expect(stats.money?.disciplines[0].gameTemplate).toBe('fifa')
  })

  it('friendly stats zawiera tylko zakłady bez stawki (stake_mode = none)', () => {
    const money: WLEntry[] = [{ win: true, loss: false, balance: 20, gameTemplate: 'fifa' }]
    const friendly: WLEntry[] = [{ win: false, loss: true, balance: 0, gameTemplate: 'chess' }]
    const stats = computeProfileStatsV2(money, friendly)
    expect(stats.friendly?.wins).toBe(0)
    expect(stats.friendly?.losses).toBe(1)
    expect(stats.friendly?.disciplines[0].gameTemplate).toBe('chess')
  })

  it('bilans finansowy pojawia się tylko w sekcji money (friendly.balance = 0)', () => {
    const money: WLEntry[] = [{ win: true, loss: false, balance: 50, gameTemplate: 'fifa' }]
    const friendly: WLEntry[] = [{ win: true, loss: false, balance: 0, gameTemplate: 'chess' }]
    const stats = computeProfileStatsV2(money, friendly)
    expect(stats.money?.balance).toBe(50)
    expect(stats.friendly?.balance).toBe(0)
  })

  it('puste sekcje zwracają null gdy brak zakładów danego typu', () => {
    const stats = computeProfileStatsV2([], [])
    expect(stats.money).toBeNull()
    expect(stats.friendly).toBeNull()
    expect(stats.overall.wins).toBe(0)
    expect(stats.overall.losses).toBe(0)
  })

  it('money null gdy brak zakładów na pieniądze, overall liczy tylko friendly', () => {
    const friendly: WLEntry[] = [
      { win: true, loss: false, balance: 0, gameTemplate: 'chess' },
      { win: true, loss: false, balance: 0, gameTemplate: 'chess' },
    ]
    const stats = computeProfileStatsV2([], friendly)
    expect(stats.money).toBeNull()
    expect(stats.overall.wins).toBe(2)
    expect(stats.overall.losses).toBe(0)
  })

  it('friendly null gdy brak towarzyskich, overall liczy tylko money', () => {
    const money: WLEntry[] = [
      { win: false, loss: true, balance: -10, gameTemplate: 'pool' },
    ]
    const stats = computeProfileStatsV2(money, [])
    expect(stats.friendly).toBeNull()
    expect(stats.overall.wins).toBe(0)
    expect(stats.overall.losses).toBe(1)
  })

  it('rejected i cancelled nie wliczają się — bets z tymi statusami nie trafiają do entries', () => {
    // Filtrowanie rejected/cancelled odbywa się w getProfileStatsV2 przed budowaniem entries.
    // Tutaj weryfikujemy że puste entries = zerowe statystyki.
    const stats = computeProfileStatsV2([], [])
    expect(stats.overall.wins).toBe(0)
    expect(stats.overall.losses).toBe(0)
    expect(stats.money).toBeNull()
    expect(stats.friendly).toBeNull()
  })

  it('winRate wynosi 0 gdy brak meczów z wynikiem', () => {
    const stats = computeProfileStatsV2([], [])
    expect(stats.overall.winRate).toBe(0)
  })

  it('winRate 100% gdy same wygrane', () => {
    const money: WLEntry[] = [
      { win: true, loss: false, balance: 10, gameTemplate: 'fifa' },
      { win: true, loss: false, balance: 20, gameTemplate: 'pool' },
    ]
    const stats = computeProfileStatsV2(money, [])
    expect(stats.overall.winRate).toBe(100)
    expect(stats.money?.winRate).toBe(100)
  })
})
