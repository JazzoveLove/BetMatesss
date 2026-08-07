import * as Sentry from '@sentry/react-native'
import {
  NavigationContainer,
  createNavigationContainerRef,
  type ParamListBase,
} from '@react-navigation/native'
import { useState } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { TamaguiProvider } from 'tamagui'
import { ErrorBoundary } from 'react-error-boundary'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuthContext } from '@/features/auth'
import LoginScreen from '@/features/auth/screens/login'
import RegisterScreen from '@/features/auth/screens/register'
import SetupProfileScreen from '@/features/auth/screens/setup-profile'
import BetDetailScreen from '@/features/bets/screens/bet-detail'
import JoinBetScreen from '@/features/bets/screens/join-bet'
import RivalryScreen from '@/features/rivalry/screens/rivalry'
import { hasPendingFriendInvites } from '@/features/friends'
import tamaguiConfig from '../tamagui.config'
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

export default Sentry.wrap(function App() {
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
});
