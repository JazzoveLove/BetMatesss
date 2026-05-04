/** Subskrypcje realtime dla szczegółów zakładu */

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { log } from '../utils/logger'

export function useBetDetailRealtime(betId: string, onUpdate: () => void): void {
  useEffect(() => {
    const participantsChannel = supabase
      .channel(`bet-participants-${betId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bet_participants',
          filter: `bet_id=eq.${betId}`,
        },
        () => {
          void onUpdate()
        },
      )
      .subscribe()

    const betsChannel = supabase
      .channel(`bet-row-${betId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bets',
          filter: `id=eq.${betId}`,
        },
        () => {
          void onUpdate()
        },
      )
      .subscribe()

    const betResultsChannel = supabase
      .channel(`bet-results-${betId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bet_results',
          filter: `bet_id=eq.${betId}`,
        },
        () => {
          void onUpdate()
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bet_results',
          filter: `bet_id=eq.${betId}`,
        },
        () => {
          void onUpdate()
        },
      )
      .subscribe()

    const settlementsChannel = supabase
      .channel(`settlements-${betId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'settlements',
          filter: `bet_id=eq.${betId}`,
        },
        payload => {
          log('[useBetDetail realtime] settlements INSERT', payload)
          void onUpdate()
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'settlements',
          filter: `bet_id=eq.${betId}`,
        },
        payload => {
          log('[useBetDetail realtime] settlements UPDATE', payload)
          void onUpdate()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(participantsChannel)
      supabase.removeChannel(betsChannel)
      supabase.removeChannel(betResultsChannel)
      supabase.removeChannel(settlementsChannel)
    }
  }, [betId, onUpdate])
}
