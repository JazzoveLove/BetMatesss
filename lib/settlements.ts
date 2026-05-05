import { AuthService } from '../services/auth.service'
import { confirmPayment as confirmSettlementPayment, markAsPaid as markSettlementAsPaid, rejectPayment as rejectSettlementPayment } from '../services/settlements.service'

async function requireCurrentUserId(): Promise<string> {
  const userId = await AuthService.getCurrentUserId()
  if (!userId) throw new Error('Brak zalogowanego użytkownika')
  return userId
}

export async function markAsPaid(settlementId: string): Promise<{ error?: string }> {
  const userId = await requireCurrentUserId()
  return markSettlementAsPaid(settlementId, userId)
}

export async function confirmPayment(settlementId: string): Promise<{ error?: string }> {
  const userId = await requireCurrentUserId()
  return confirmSettlementPayment(settlementId, userId)
}

export async function rejectPayment(settlementId: string): Promise<{ error?: string }> {
  const userId = await requireCurrentUserId()
  return rejectSettlementPayment(settlementId, userId)
}
