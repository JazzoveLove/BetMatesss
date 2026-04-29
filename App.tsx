import { useEffect, useState, useRef } from 'react'
import { StyleSheet } from 'react-native'
import * as Linking from 'expo-linking'
import { TamaguiProvider, Text, Button } from 'tamagui'
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Session } from '@supabase/supabase-js'
import { AuthService } from './services/auth.service'
import LoginScreen from './app/login'
import SetupProfileScreen from './app/setup-profile'
import DashboardScreen from './app/dashboard'
import HistoryScreen from './app/history'
import NewBetScreen from './app/new-bet'
import FriendsScreen from './app/friends'
import ProfileScreen from './app/profile'
import BetDetailScreen from './app/bet-detail'
import JoinBetScreen from './app/join-bet'
import RivalryScreen from './app/rivalry'
import {
  enqueueFriendInvite,
  setNavigateToFriendsTab,
  hasPendingFriendInvites,
} from './lib/friend-invite-queue'
import { extractFriendIdFromUrl } from './lib/friend-invite-url'
import { extractBetInviteCodeFromUrl } from './lib/bet-invite-url'
import tamaguiConfig from './tamagui.config'
import { Colors } from './constants/colors'

// ─── Navigators ───────────────────────────────────────────────────────────────

const navigationRef = createNavigationContainerRef()

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

type AppState = 'loading' | 'auth' | 'setup' | 'main'

function TabIcon({ icon, color }: { icon: string; color: string }) {
  return (
    <Text style={{ fontSize: 20, color }}>{icon}</Text>
  )
}

// ─── Tab navigator ────────────────────────────────────────────────────────────

function TabNavigator() {
  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.accentLight,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} /> }}
      />
      <Tab.Screen
        name="Historia"
        component={HistoryScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon icon="📋" color={color} /> }}
      />
      <Tab.Screen
        name="Nowy"
        component={NewBetScreen}
        options={{
          headerShown: false,
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: ({ onPress }) => (
            <Button
              unstyled
              onPress={onPress}
              style={styles.newBetBtn}
              pressStyle={{ opacity: 0.8 }}
            >
              <Text style={styles.newBetPlus}>+</Text>
            </Button>
          ),
        }}
      />
      <Tab.Screen
        name="Znajomi"
        component={FriendsScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon icon="👥" color={color} /> }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color }) => <TabIcon icon="👤" color={color} /> }}
      />
    </Tab.Navigator>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

function AppContent() {
  const [appState, setAppState] = useState<AppState>('loading')
  const [session, setSession] = useState<Session | null>(null)
  const [pendingBetInviteCode, setPendingBetInviteCode] = useState<string | null>(null)
  const appStateRef = useRef<AppState>('loading')
  appStateRef.current = appState

  async function checkProfile(sess: Session) {
    setSession(sess)
    const hasProfile = await AuthService.hasProfile(sess.user.id)
    setAppState(hasProfile ? 'main' : 'setup')
  }

  useEffect(() => {
    AuthService.getSession().then(({ data: { session } }) => {
      if (!session) { setAppState('auth'); return }
      checkProfile(session)
    })

    const { data: { subscription } } = AuthService.onAuthStateChange((_event, sess) => {
      if (!sess) { setSession(null); setAppState('auth'); return }
      checkProfile(sess)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!pendingBetInviteCode) return
    if (appState !== 'main') return
    if (!navigationRef.isReady()) return
    ;(navigationRef as { navigate: (a: string, b?: object) => void }).navigate('JoinBet', {
      code: pendingBetInviteCode,
    })
    setPendingBetInviteCode(null)
  }, [pendingBetInviteCode, appState])

  useEffect(() => {
    setNavigateToFriendsTab(() => {
      if (appStateRef.current !== 'main') return
      if (navigationRef.isReady()) {
        ;(navigationRef as { navigate: (a: string, b?: object) => void }).navigate('Tabs', {
          screen: 'Znajomi',
        })
      }
    })
    return () => setNavigateToFriendsTab(null)
  }, [])

  useEffect(() => {
    async function consumeInitialUrl() {
      const initial = await Linking.getInitialURL()
      if (initial) {
        const betCode = extractBetInviteCodeFromUrl(initial)
        if (betCode) setPendingBetInviteCode(betCode)
        const id = extractFriendIdFromUrl(initial)
        if (id) enqueueFriendInvite(id)
      }
    }
    void consumeInitialUrl()

    const sub = Linking.addEventListener('url', ({ url }) => {
      const betCode = extractBetInviteCodeFromUrl(url)
      if (betCode) {
        if (navigationRef.isReady() && appStateRef.current === 'main') {
          ;(navigationRef as { navigate: (a: string, b?: object) => void }).navigate('JoinBet', {
            code: betCode,
          })
        } else {
          setPendingBetInviteCode(betCode)
        }
      }
      const id = extractFriendIdFromUrl(url)
      if (id) enqueueFriendInvite(id)
    })
    return () => sub.remove()
  }, [])

  if (appState === 'loading') return null
  if (appState === 'auth') return <LoginScreen />
  if (appState === 'setup' && session) {
    return (
      <SetupProfileScreen
        userId={session.user.id}
        onComplete={() => setAppState('main')}
      />
    )
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        if (pendingBetInviteCode) {
          ;(navigationRef as { navigate: (a: string, b?: object) => void }).navigate('JoinBet', {
            code: pendingBetInviteCode,
          })
          setPendingBetInviteCode(null)
        }
        if (
          hasPendingFriendInvites() &&
          navigationRef.isReady() &&
          appStateRef.current === 'main'
        ) {
          ;(navigationRef as { navigate: (a: string, b?: object) => void }).navigate('Tabs', {
            screen: 'Znajomi',
          })
        }
      }}
    >
      <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen
          name="BetDetail"
          component={BetDetailScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="JoinBet"
          component={JoinBetScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Rivalry"
          component={RivalryScreen}
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
      <AppContent />
    </TamaguiProvider>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.card,
    borderTopColor: Colors.borderSoft,
    borderTopWidth: 1,
    height: 72,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  newBetBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  newBetPlus: {
    fontSize: 32,
    color: Colors.white,
    lineHeight: 36,
    fontWeight: '300',
  },
})
