import { supabase } from '../../lib/supabase'

// Singleton per userId: multiple callers share one channel to avoid
// "cannot add postgres_changes callbacks after subscribe()" errors.
type ChannelEntry = {
  channel: ReturnType<typeof supabase.channel>
  callbacks: Set<() => void>
}
const _activeChannels = new Map<string, ChannelEntry>()

export function subscribeFriendshipChanges(
  userId: string,
  onChange: () => void,
): () => void {
  if (!_activeChannels.has(userId)) {
    const callbacks = new Set<() => void>()
    const channel = supabase
      .channel(`friendships-live-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships', filter: `user_a=eq.${userId}` },
        () => callbacks.forEach(cb => cb()),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships', filter: `user_b=eq.${userId}` },
        () => callbacks.forEach(cb => cb()),
      )
      .subscribe()
    _activeChannels.set(userId, { channel, callbacks })
  }

  const entry = _activeChannels.get(userId)!
  entry.callbacks.add(onChange)

  return () => {
    entry.callbacks.delete(onChange)
    if (entry.callbacks.size === 0) {
      void supabase.removeChannel(entry.channel)
      _activeChannels.delete(userId)
    }
  }
}
