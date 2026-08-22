import * as Sentry from '@sentry/react-native'
import {
  NavigationContainer,
  createNavigationContainerRef,
  type ParamListBase,
} from '@react-navigation/native'
import { useEffect, useState } from 'react'
import * as Linking from 'expo-linking'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ErrorBoundary } from 'react-error-boundary'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuthContext } from '@/features/auth'
import WelcomeScreen from '@/features/auth/screens/welcome'
import LoginScreen from '@/features/auth/screens/login'
import RegisterScreen from '@/features/auth/screens/register'
import SetupProfileScreen from '@/features/auth/screens/setup-profile'
import BetDetailScreen from '@/features/bets/screens/bet-detail'
import SettingsScreen from '@/features/profile/screens/settings'
import FriendDetailScreen from '@/features/friend-detail/screens/friend-detail'
import {
  enqueueFriendInvite,
  extractFriendIdFromUrl,
  hasPendingFriendInvites,
  setNavigateToFriendsTab,
} from '@/features/friends'
import { AppErrorFallback } from '@/shared/components/AppErrorFallback'
import { ToastProvider } from '@/shared/components/Toast'
import { TabNavigator, withScreenBoundary } from './navigation/TabNavigator'

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN

if (!SENTRY_DSN) {
  console.warn('Brak zmiennej środowiskowej EXPO_PUBLIC_SENTRY_DSN — Sentry nie zostanie zainicjalizowany')
} else {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 1.0,
  })
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

const navigationRef = createNavigationContainerRef<ParamListBase>()

const Stack = createNativeStackNavigator()

function AppContent() {
  const { appState, session, completeSetup } = useAuthContext()
  const [authScreen, setAuthScreen] = useState<'welcome' | 'login' | 'register'>('welcome')

  useEffect(() => {
    setNavigateToFriendsTab(() => {
      if (navigationRef.isReady()) {
        ;(navigationRef as { navigate: (a: string, b?: object) => void }).navigate(
          'Tabs',
          { screen: 'Znajomi' },
        )
      }
    })
    return () => setNavigateToFriendsTab(null)
  }, [])

  useEffect(() => {
    function handleUrl(url: string) {
      const friendId = extractFriendIdFromUrl(url)
      if (friendId) {
        enqueueFriendInvite(friendId)
        return
      }
    }

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url)
    })

    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url))
    return () => subscription.remove()
  }, [])

  if (appState === 'loading') return null
  if (appState === 'auth') {
    if (authScreen === 'welcome') {
      return (
        <WelcomeScreen
          onGoToLogin={() => setAuthScreen('login')}
          onGoToRegister={() => setAuthScreen('register')}
        />
      )
    }
    return authScreen === 'login'
      ? <LoginScreen onGoToWelcome={() => setAuthScreen('welcome')} />
      : <RegisterScreen onGoToWelcome={() => setAuthScreen('welcome')} />
  }
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
        name="FriendDetail"
        component={withScreenBoundary(FriendDetailScreen)}
        options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Settings"
          component={withScreenBoundary(SettingsScreen)}
          options={{ animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default Sentry.wrap(function App() {
  return (
    <ErrorBoundary FallbackComponent={AppErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
});
