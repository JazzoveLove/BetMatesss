// ─── Deep link: betmates://friends?add=<user_uuid> ────────────────────────────

const queue: string[] = []
type Listener = () => void
const listeners = new Set<Listener>()

let navigateToFriendsTab: (() => void) | null = null

export function setNavigateToFriendsTab(fn: (() => void) | null) {
  navigateToFriendsTab = fn
}

export function enqueueFriendInvite(userId: string) {
  if (!queue.includes(userId)) queue.push(userId)
  navigateToFriendsTab?.()
  listeners.forEach((l) => l())
}

export function drainFriendInvites(): string[] {
  const out = queue.slice()
  queue.length = 0
  return out
}

export function hasPendingFriendInvites(): boolean {
  return queue.length > 0
}

export function subscribeFriendInvites(cb: Listener) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}
