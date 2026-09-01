import { supabase } from '@/shared/lib/supabase'

/**
 * Stan, jaki nada spłacie trigger set_payment_status_on_insert w bazie:
 *   - 'confirmed' — wpis wierzyciela (createdBy === toUser); od razu w bilansie
 *   - 'pending'   — wpis dłużnika; czeka na potwierdzenie wierzyciela
 */
type RecordedPaymentStatus = 'confirmed' | 'pending'

type RecordPaymentResult = { error?: string; status?: RecordedPaymentStatus }

export async function recordPayment(
  fromUser: string,
  toUser: string,
  amount: number,
  createdBy: string,
): Promise<RecordPaymentResult> {
  if (amount <= 0) return { error: 'Kwota musi być większa od zera.' }

  const { error } = await supabase.from('payments').insert({
    from_user: fromUser,
    to_user: toUser,
    amount,
    created_by: createdBy,
  })

  if (error) return { error: error.message }
  // Trigger w bazie ustala status; klient go NIE wysyła. Odtwarzamy tu tę samą
  // regułę tylko po to, żeby UI pokazało właściwy komunikat bez dodatkowego
  // round-tripu (wpis wierzyciela = od razu zapisane; wpis dłużnika = wysłane
  // do potwierdzenia).
  return { status: createdBy === toUser ? 'confirmed' : 'pending' }
}

/** Wierzyciel (to_user) potwierdza wiszącą spłatę — polityka payments_confirm_or_reject. */
export async function confirmPayment(paymentId: string): Promise<{ error?: string }> {
  const { error } = await supabase.from('payments').update({ status: 'confirmed' }).eq('id', paymentId)
  if (error) return { error: error.message }
  return {}
}

/** Wierzyciel (to_user) odrzuca wiszącą spłatę — dług zostaje, wiersz nie znika. */
export async function rejectPayment(paymentId: string): Promise<{ error?: string }> {
  const { error } = await supabase.from('payments').update({ status: 'rejected' }).eq('id', paymentId)
  if (error) return { error: error.message }
  return {}
}

/**
 * Autor wpisu wycofuje własną, jeszcze nierozpatrzoną spłatę. delete_payment
 * jest po 20260902120000 zawężone do created_by + status='pending', więc
 * potwierdzonej/odrzuconej to nie ruszy.
 */
export async function retractPayment(paymentId: string): Promise<{ error?: string }> {
  const { error } = await supabase.rpc('delete_payment', { p_payment_id: paymentId })
  if (error) return { error: error.message }
  return {}
}
