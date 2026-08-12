import { supabase } from '@/shared/lib/supabase'

export async function recordPayment(
  fromUser: string,
  toUser: string,
  amount: number,
  createdBy: string,
): Promise<{ error?: string }> {
  if (amount <= 0) return { error: 'Kwota musi być większa od zera.' }

  const { error } = await supabase.from('payments').insert({
    from_user: fromUser,
    to_user: toUser,
    amount,
    created_by: createdBy,
  })

  if (error) return { error: error.message }
  return {}
}