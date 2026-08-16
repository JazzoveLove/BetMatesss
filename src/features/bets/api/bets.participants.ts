import { supabase } from '@/shared/lib/supabase'

export async function confirmParticipation(betId: string, userId: string): Promise<{ error?: string }> {
  const { error: confirmError } = await supabase
    .from('bet_participants')
    .update({ confirmed: true })
    .eq('bet_id', betId)
    .eq('user_id', userId)

  if (confirmError) return { error: confirmError.message }

  const { data: allParticipants, error: allError } = await supabase
    .from('bet_participants')
    .select('confirmed')
    .eq('bet_id', betId)

  if (allError) return { error: allError.message }

  const everyoneConfirmed = ((allParticipants ?? []) as { confirmed: boolean }[]).every(p => p.confirmed)
  if (everyoneConfirmed) {
    const { error: statusError } = await supabase
      .from('bets')
      .update({ status: 'active' })
      .eq('id', betId)
      .eq('status', 'pending')
    if (statusError) return { error: statusError.message }
  }

  return {}
}

export async function rejectParticipation(betId: string, userId: string): Promise<{ error?: string }> {
  const { data: participant, error: checkErr } = await supabase
    .from('bet_participants')
    .select('user_id')
    .eq('bet_id', betId)
    .eq('user_id', userId)
    .maybeSingle()

  if (checkErr) return { error: checkErr.message }
  if (!participant) return { error: 'Nie jesteś uczestnikiem tego zakładu.' }

  const { error: updateErr } = await supabase
    .from('bets')
    .update({ status: 'rejected', rejected_at: new Date().toISOString() })
    .eq('id', betId)
    .eq('status', 'pending')

  if (updateErr) return { error: updateErr.message }
  return {}
}
