import { BetsService } from '@/features/bets'
import type { HistoryListItem } from '@/features/bets/types/bet.types'

export async function getHistoryForPair(viewerId: string, otherId: string): Promise<HistoryListItem[]> {
  const items = await BetsService.getHistoryForUser(viewerId)
  return items.filter(item => item.opponentId === otherId)
}