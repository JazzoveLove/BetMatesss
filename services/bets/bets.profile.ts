import { supabase } from '../../lib/supabase'
import { computeProfileStatsV2, type WLEntry } from '../../utils/profileStats'
import type { ProfileStatsV2 } from '../../types/bet.types'
import { getUserBets } from './bets.queries'

type SettlementRow = {
  bet_id: string
  debtor_id: string
  creditor_id: string
  amount: number
  paid?: boolean
  payment_status?: 'unpaid' | 'pending_confirmation' | 'paid' | 'disputed' | null
}

type BetResultRow = {
  bet_id: string
  winner_id: string
}

const EMPTY_SECTION = { wins: 0, losses: 0, winRate: 0, balance: 0, disciplines: [] }

export async function getProfileStatsV2(userId: string): Promise<ProfileStatsV2> {
  const allBets = await getUserBets(userId)
  const completedBets = allBets.filter(b => b.status === 'completed')

  if (completedBets.length === 0) {
    return { overall: EMPTY_SECTION, money: null, friendly: null }
  }

  const moneyBets = completedBets.filter(b => b.stakeMode !== 'none')
  const friendlyBets = completedBets.filter(b => b.stakeMode === 'none')

  const [settlementsRes, resultsRes] = await Promise.all([
    moneyBets.length > 0
      ? supabase
          .from('settlements')
          .select('bet_id, debtor_id, creditor_id, amount, paid, payment_status')
          .in('bet_id', moneyBets.map(b => b.id))
      : Promise.resolve({ data: [] as SettlementRow[], error: null }),
    friendlyBets.length > 0
      ? supabase
          .from('bet_results')
          .select('bet_id, winner_id')
          .in('bet_id', friendlyBets.map(b => b.id))
          .eq('confirmed', true)
      : Promise.resolve({ data: [] as BetResultRow[], error: null }),
  ])

  const settlements = (settlementsRes.data ?? []) as SettlementRow[]
  const betResults = (resultsRes.data ?? []) as BetResultRow[]

  // Money bets: W/L from settlements (creditor wins)
  const moneyEntries: WLEntry[] = []
  for (const bet of moneyBets) {
    const active = settlements
      .filter(s => s.bet_id === bet.id)
      .filter(s => (s.payment_status ?? (s.paid ? 'paid' : 'unpaid')) !== 'paid')

    if (active.length === 0) continue

    const won = active.some(s => s.creditor_id === userId)
    const lost = active.some(s => s.debtor_id === userId)
    if (!won && !lost) continue

    const balance = active.reduce((acc, s) => {
      if (s.creditor_id === userId) return acc + Number(s.amount)
      if (s.debtor_id === userId) return acc - Number(s.amount)
      return acc
    }, 0)

    moneyEntries.push({ win: won, loss: lost, balance, gameTemplate: bet.gameTemplate })
  }

  // Friendly bets: W/L from confirmed bet_results.winner_id
  const resultByBet = new Map<string, string>()
  for (const r of betResults) {
    if (!resultByBet.has(r.bet_id)) resultByBet.set(r.bet_id, r.winner_id)
  }

  const friendlyEntries: WLEntry[] = []
  for (const bet of friendlyBets) {
    const winnerId = resultByBet.get(bet.id)
    if (!winnerId) continue
    friendlyEntries.push({
      win: winnerId === userId,
      loss: winnerId !== userId,
      balance: 0,
      gameTemplate: bet.gameTemplate,
    })
  }

  return computeProfileStatsV2(moneyEntries, friendlyEntries)
}
