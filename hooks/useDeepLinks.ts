import * as Linking from 'expo-linking'
import { useEffect, useRef } from 'react'
import {
  createNavigationContainerRef,
  type ParamListBase,
} from '@react-navigation/native'
import {
  enqueueFriendInvite,
  setNavigateToFriendsTab,
} from '../lib/friend-invite-queue'
import { extractFriendIdFromUrl } from '../lib/friend-invite-url'
import { extractBetInviteCodeFromUrl } from '../lib/bet-invite-url'
import type { AppAuthState } from '../contexts/AuthContext'

type Nav = ReturnType<typeof createNavigationContainerRef<ParamListBase>>

function navNavigate(navigationRef: Nav, screen: string, params?: object) {
  ;(navigationRef as { navigate: (a: string, b?: object) => void }).navigate(
    screen,
    params,
  )
}

export function useDeepLinks({
  appState,
  navigationRef,
}: {
  appState: AppAuthState
  navigationRef: Nav
}) {
  const pendingBetCodeRef = useRef<string | null>(null)
  const appStateRef = useRef(appState)
  appStateRef.current = appState

  useEffect(() => {
    setNavigateToFriendsTab(() => {
      if (appStateRef.current !== 'main') return
      if (navigationRef.isReady()) {
        navNavigate(navigationRef, 'Tabs', { screen: 'Znajomi' })
      }
    })
    return () => setNavigateToFriendsTab(null)
  }, [])

  useEffect(() => {
    async function consumeInitialUrl() {
      const initial = await Linking.getInitialURL()
      if (!initial) return
      const betCode = extractBetInviteCodeFromUrl(initial)
      if (betCode) {
        if (navigationRef.isReady()) {
          navNavigate(navigationRef, 'JoinBet', { code: betCode })
        } else {
          pendingBetCodeRef.current = betCode
        }
      }
      const friendId = extractFriendIdFromUrl(initial)
      if (friendId) enqueueFriendInvite(friendId)
    }
    void consumeInitialUrl()

    const sub = Linking.addEventListener('url', ({ url }) => {
      const betCode = extractBetInviteCodeFromUrl(url)
      if (betCode) {
        if (navigationRef.isReady() && appStateRef.current === 'main') {
          navNavigate(navigationRef, 'JoinBet', { code: betCode })
        } else {
          pendingBetCodeRef.current = betCode
        }
      }
      const friendId = extractFriendIdFromUrl(url)
      if (friendId) enqueueFriendInvite(friendId)
    })

    return () => sub.remove()
  }, [])

  return { pendingBetCodeRef }
}
