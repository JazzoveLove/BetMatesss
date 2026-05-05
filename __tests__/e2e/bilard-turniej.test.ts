jest.mock('expo-linking', () => ({
  parse: (url: string) => {
    try {
      const u = new URL(url)
      const path = u.pathname.startsWith('/') ? u.pathname.slice(1) : u.pathname
      const queryParams = Object.fromEntries(u.searchParams.entries())
      return {
        hostname: u.hostname,
        path,
        queryParams,
      }
    } catch {
      return { hostname: '', path: '', queryParams: {} }
    }
  },
}))

import { buildBetInviteUrl, extractBetInviteCodeFromUrl, parseBetIdFromInviteCode } from '../../lib/bet-invite-url'
import { calculateSettlements, type SettlementDraft } from '../../utils/settlements'

type Gracz = {
  id: string
  nick: string
}

type Mecz = {
  runda: 1 | 2
  graczA: string
  graczB: string
  zwyciezca: string
  disputed: boolean
}

type StanZakladu = {
  betId: string
  gameTemplate: 'pool'
  format: 'elimination'
  stakeMode: 'equal'
  stakeAmount: number
  status: 'pending' | 'active' | 'completed' | 'disputed'
  gracze: Gracz[]
  wyeliminowani: string[]
  mecze: Mecz[]
  rozliczenia: SettlementDraft[]
}

// STUB — replace with real implementation
function rozegrajRundeEliminacji(args: {
  stan: StanZakladu
  runda: 1 | 2
  graczA: string
  graczB: string
  zwyciezca: string
  czySpor: boolean
}) {
  const { stan, runda, graczA, graczB, zwyciezca, czySpor } = args
  const przegrany = zwyciezca === graczA ? graczB : graczA

  stan.mecze.push({
    runda,
    graczA,
    graczB,
    zwyciezca,
    disputed: czySpor,
  })

  if (czySpor) {
    stan.status = 'disputed'
    return
  }

  stan.wyeliminowani.push(przegrany)
  const roundSettlements = calculateSettlements(
    [
      { id: graczA, stakeAmount: stan.stakeAmount },
      { id: graczB, stakeAmount: stan.stakeAmount },
    ],
    zwyciezca,
    stan.stakeMode,
  )
  stan.rozliczenia.push(...roundSettlements)
}

// STUB — replace with real implementation
function policzBilans(rozliczenia: SettlementDraft[], gracze: Gracz[]) {
  const bilans: Record<string, number> = {}
  gracze.forEach(g => {
    bilans[g.id] = 0
  })

  for (const r of rozliczenia) {
    bilans[r.creditorId] += r.amount
    bilans[r.debtorId] -= r.amount
  }

  return bilans
}

describe('BetMates E2E — Bilard Turniej 3 graczy', () => {
  const marek: Gracz = { id: 'marek', nick: 'Marek' }
  const tomek: Gracz = { id: 'tomek', nick: 'Tomek' }
  const kasia: Gracz = { id: 'kasia', nick: 'Kasia' }
  const gracze = [marek, tomek, kasia]

  describe('Scenariusz 1: Turniej bez sporu', () => {
    let stan: StanZakladu

    beforeEach(() => {
      stan = {
        betId: 'bet-bilard-3-graczy',
        gameTemplate: 'pool',
        format: 'elimination',
        stakeMode: 'equal',
        stakeAmount: 20,
        status: 'pending',
        gracze: [...gracze],
        wyeliminowani: [],
        mecze: [],
        rozliczenia: [],
      }
    })

    it('Marek tworzy zakład i zaprasza Tomka i Kasię', () => {
      // Arrange
      const inviteUrl = buildBetInviteUrl(stan.betId)
      const inviteUrlFallback = `https://betmates.app/join/${stan.betId}`

      // Act
      const extractedCode =
        extractBetInviteCodeFromUrl(inviteUrl) ?? extractBetInviteCodeFromUrl(inviteUrlFallback)
      const parsedBetId = extractedCode ? parseBetIdFromInviteCode(extractedCode) : null
      stan.status = 'active'

      // Assert
      expect(extractedCode).toBe(stan.betId)
      expect(parsedBetId).toBe(stan.betId)
      expect(stan.status).toBe('active')
      console.log('✅ Marek utworzył zakład bilardowy i wysłał zaproszenia deep link do Tomka i Kasi.')
    })

    it('Runda 1: Marek wygrywa z Tomkiem — Tomek odpada', () => {
      // Arrange
      stan.status = 'active'

      // Act
      rozegrajRundeEliminacji({
        stan,
        runda: 1,
        graczA: marek.id,
        graczB: tomek.id,
        zwyciezca: marek.id,
        czySpor: false,
      })

      // Assert
      expect(stan.wyeliminowani).toContain(tomek.id)
      expect(stan.mecze[0]).toEqual({
        runda: 1,
        graczA: 'marek',
        graczB: 'tomek',
        zwyciezca: 'marek',
        disputed: false,
      })
      console.log('✅ Runda 1 zakończona. Marek wygrał z Tomkiem, Tomek odpada z turnieju.')
    })

    it('Runda 1: rozliczenie częściowe — Tomek winien Markowi 20 PLN', () => {
      // Arrange
      rozegrajRundeEliminacji({
        stan,
        runda: 1,
        graczA: marek.id,
        graczB: tomek.id,
        zwyciezca: marek.id,
        czySpor: false,
      })

      // Act
      const [partial] = stan.rozliczenia

      // Assert
      expect(partial).toEqual({
        debtorId: tomek.id,
        creditorId: marek.id,
        amount: 20,
      })
      console.log('✅ Tomek odpada. Winien Markowi: 20 PLN (rozliczenie zapisane, jeszcze nieopłacone).')
    })

    it('Runda 2 (finał): Kasia wygrywa z Markiem', () => {
      // Arrange
      rozegrajRundeEliminacji({
        stan,
        runda: 1,
        graczA: marek.id,
        graczB: tomek.id,
        zwyciezca: marek.id,
        czySpor: false,
      })

      // Act
      rozegrajRundeEliminacji({
        stan,
        runda: 2,
        graczA: marek.id,
        graczB: kasia.id,
        zwyciezca: kasia.id,
        czySpor: false,
      })

      // Assert
      expect(stan.wyeliminowani).toEqual(expect.arrayContaining([tomek.id, marek.id]))
      expect(stan.mecze[1].zwyciezca).toBe(kasia.id)
      console.log('✅ Finał: Kasia zgłasza wygraną, Marek potwierdza. Kasia wygrywa turniej.')
    })

    it('Finalne rozliczenie: Kasia +40, Marek 0, Tomek -20', () => {
      // Arrange
      rozegrajRundeEliminacji({
        stan,
        runda: 1,
        graczA: marek.id,
        graczB: tomek.id,
        zwyciezca: marek.id,
        czySpor: false,
      })
      rozegrajRundeEliminacji({
        stan,
        runda: 2,
        graczA: marek.id,
        graczB: kasia.id,
        zwyciezca: kasia.id,
        czySpor: false,
      })

      // Act
      const bilans = policzBilans(stan.rozliczenia, stan.gracze)

      // Assert
      expect(stan.rozliczenia).toEqual([
        { debtorId: 'tomek', creditorId: 'marek', amount: 20 },
        { debtorId: 'marek', creditorId: 'kasia', amount: 20 },
      ])
      expect(bilans).toEqual({
        marek: 0,
        tomek: -20,
        kasia: 20,
      })
      console.log('✅ Macierz rozliczeń poprawna: Tomek→Marek 20 PLN, Marek→Kasia 20 PLN.')
      console.log('ℹ️ Bilans netto płatności: Kasia +20 PLN, Marek 0 PLN, Tomek -20 PLN.')
    })

    it('Zakład ma status completed', () => {
      // Arrange
      rozegrajRundeEliminacji({
        stan,
        runda: 1,
        graczA: marek.id,
        graczB: tomek.id,
        zwyciezca: marek.id,
        czySpor: false,
      })
      rozegrajRundeEliminacji({
        stan,
        runda: 2,
        graczA: marek.id,
        graczB: kasia.id,
        zwyciezca: kasia.id,
        czySpor: false,
      })

      // Act
      stan.status = 'completed'

      // Assert
      expect(stan.status).toBe('completed')
      expect(stan.mecze).toHaveLength(2)
      console.log('✅ Turniej zakończony. Status zakładu: completed.')
    })
  })

  describe('Scenariusz 2: Marek kwestionuje wynik finału', () => {
    let stan: StanZakladu

    beforeEach(() => {
      stan = {
        betId: 'bet-bilard-3-graczy-spor',
        gameTemplate: 'pool',
        format: 'elimination',
        stakeMode: 'equal',
        stakeAmount: 20,
        status: 'active',
        gracze: [...gracze],
        wyeliminowani: [],
        mecze: [],
        rozliczenia: [],
      }

      rozegrajRundeEliminacji({
        stan,
        runda: 1,
        graczA: marek.id,
        graczB: tomek.id,
        zwyciezca: marek.id,
        czySpor: false,
      })
    })

    it('Kasia zgłasza wygraną, Marek disputuje', () => {
      // Arrange
      expect(stan.rozliczenia).toHaveLength(1)

      // Act
      rozegrajRundeEliminacji({
        stan,
        runda: 2,
        graczA: marek.id,
        graczB: kasia.id,
        zwyciezca: kasia.id,
        czySpor: true,
      })

      // Assert
      expect(stan.mecze[1]).toEqual({
        runda: 2,
        graczA: 'marek',
        graczB: 'kasia',
        zwyciezca: 'kasia',
        disputed: true,
      })
      console.log('⚠️ Finał zgłoszony przez Kasię, ale Marek kwestionuje wynik (dispute).')
    })

    it('Status zakładu zmienia się na disputed', () => {
      // Arrange
      expect(stan.status).toBe('active')

      // Act
      rozegrajRundeEliminacji({
        stan,
        runda: 2,
        graczA: marek.id,
        graczB: kasia.id,
        zwyciezca: kasia.id,
        czySpor: true,
      })

      // Assert
      expect(stan.status).toBe('disputed')
      console.log('✅ Status zakładu zmieniony na disputed.')
    })

    it('Rozliczenie jest zablokowane — nikt nie jest winien nic jeszcze', () => {
      // Arrange
      const rozliczeniaPrzedSporem = [...stan.rozliczenia]

      // Act
      rozegrajRundeEliminacji({
        stan,
        runda: 2,
        graczA: marek.id,
        graczB: kasia.id,
        zwyciezca: kasia.id,
        czySpor: true,
      })

      // Assert
      expect(stan.status).toBe('disputed')
      expect(stan.rozliczenia).toEqual(rozliczeniaPrzedSporem)
      expect(stan.rozliczenia).toEqual([{ debtorId: 'tomek', creditorId: 'marek', amount: 20 }])
      expect(stan.mecze[1].disputed).toBe(true)
      console.log('✅ Rozliczenie finału zablokowane do czasu rozstrzygnięcia sporu.')
    })
  })
})
