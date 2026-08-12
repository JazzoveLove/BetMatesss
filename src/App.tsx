import * as Sentry from '@sentry/react-native'
import {
  NavigationContainer,
  createNavigationContainerRef,
  type ParamListBase,
} from '@react-navigation/native'
import { useState } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ErrorBoundary } from 'react-error-boundary'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuthContext } from '@/features/auth'
import LoginScreen from '@/features/auth/screens/login'
import RegisterScreen from '@/features/auth/screens/register'
import SetupProfileScreen from '@/features/auth/screens/setup-profile'
import BetDetailScreen from '@/features/bets/screens/bet-detail'
import SettingsScreen from '@/features/profile/screens/settings'
import FriendDetailScreen from '@/features/friend-detail/screens/friend-detail'
import { hasPendingFriendInvites } from '@/features/friends'
import { AppErrorFallback } from '@/shared/components/AppErrorFallback'
import { TabNavigator, withScreenBoundary } from './navigation/TabNavigator'

Sentry.init({
  dsn: 'https://6d2d5497873ff80878f5dc94e18b970f@o4511869702438912.ingest.de.sentry.io/4511869752705104',
  tracesSampleRate: 1.0,
})

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
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('login')

  if (appState === 'loading') return null
  if (appState === 'auth') {
    return authScreen === 'login'
      ? <LoginScreen onGoToRegister={() => setAuthScreen('register')} />
      : <RegisterScreen onGoToLogin={() => setAuthScreen('login')} />
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
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
});
