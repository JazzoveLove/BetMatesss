import {
  NavigationContainer,
  createNavigationContainerRef,
  type ParamListBase,
} from '@react-navigation/native'
import { useEffect } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import * as Notifications from 'expo-notifications'
import { TamaguiProvider } from 'tamagui'
import { ErrorBoundary } from 'react-error-boundary'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuthContext } from './contexts/AuthContext'
import LoginScreen from './app/login'
import SetupProfileScreen from './app/setup-profile'
import BetDetailScreen from './app/bet-detail'
import JoinBetScreen from './app/join-bet'
import RivalryScreen from './app/rivalry'
import { hasPendingFriendInvites } from './lib/friend-invite-queue'
import tamaguiConfig from './tamagui.config'
import { AppErrorFallback } from './components/AppErrorFallback'
import { TabNavigator, withScreenBoundary } from './navigation/TabNavigator'
import { useDeepLinks } from './hooks/useDeepLinks'
import { registerAndSyncPushToken } from './lib/notifications'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

const navigationRef = createNavigationContainerRef<ParamListBase>()

const Stack = createNativeStackNavigator()

function AppContent() {
  const { appState, session, userId, completeSetup } = useAuthContext()

  const { pendingBetCodeRef } = useDeepLinks({
    appState,
    navigationRef,
  })

  useEffect(() => {
    if (appState !== 'main' || !userId) return
    void registerAndSyncPushToken(userId)
  }, [appState, userId])

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as { betId?: string }
      if (!data.betId || !navigationRef.isReady()) return
      ;(navigationRef as { navigate: (a: string, b?: object) => void }).navigate('BetDetail', {
        betId: data.betId,
      })
    })

    return () => subscription.remove()
  }, [])

  if (appState === 'loading') return null
  if (appState === 'auth') return <LoginScreen />
  if (appState === 'setup' && session) {
    return (
      <SetupProfileScreen
        userId={session.user.id}
        onComplete={completeSetup}
      />
    )
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        const betCode = pendingBetCodeRef.current
        if (betCode) {
          ;(navigationRef as { navigate: (a: string, b?: object) => void }).navigate(
            'JoinBet',
            { code: betCode },
          )
          pendingBetCodeRef.current = null
        }
        if (
          hasPendingFriendInvites() &&
          navigationRef.isReady() &&
          appState === 'main'
        ) {
          ;(navigationRef as { navigate: (a: string, b?: object) => void }).navigate(
            'Tabs',
            { screen: 'Znajomi' },
          )
        }
      }}
    >
      <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen
          name="BetDetail"
          component={withScreenBoundary(BetDetailScreen)}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="JoinBet"
          component={withScreenBoundary(JoinBetScreen)}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Rivalry"
          component={withScreenBoundary(RivalryScreen)}
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={AppErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </TamaguiProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
