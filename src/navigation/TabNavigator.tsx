import React from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Pressable, Text } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import DashboardScreen from '@/features/bets/screens/dashboard'
import HistoryScreen from '@/features/bets/screens/history'
import NewBetScreen from '@/features/bets/screens/new-bet'
import FriendsScreen from '@/features/friends/screens/friends'
import ProfileScreen from '@/features/profile/screens/profile'
import { Colors } from '@/shared/constants/colors'
import { ScreenErrorFallback } from '@/shared/components/ScreenErrorFallback'
import { styles } from './styles/TabNavigator.styles'

const Tab = createBottomTabNavigator()

function TabIcon({ icon, color }: { icon: string; color: string }) {
  return (
    <Text style={{ fontSize: 20, color }}>{icon}</Text>
  )
}

export function withScreenBoundary(Screen: React.ComponentType<Record<string, unknown>>) {
  return function ScreenWithBoundary(props: Record<string, unknown>) {
    return (
      <ErrorBoundary FallbackComponent={ScreenErrorFallback}>
        <Screen {...props} />
      </ErrorBoundary>
    )
  }
}

export function TabNavigator() {
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
        component={withScreenBoundary(DashboardScreen)}
        options={{ tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} /> }}
      />
      <Tab.Screen
        name="Historia"
        component={withScreenBoundary(HistoryScreen)}
        options={{ tabBarIcon: ({ color }) => <TabIcon icon="📋" color={color} /> }}
      />
      <Tab.Screen
        name="Nowy"
        component={withScreenBoundary(NewBetScreen)}
        options={{
          headerShown: false,
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: ({ onPress }) => (
            <Pressable
              onPress={onPress}
              style={({ pressed }) => [styles.newBetBtn, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.newBetPlus}>+</Text>
            </Pressable>
          ),
        }}
      />
      <Tab.Screen
        name="Znajomi"
        component={withScreenBoundary(FriendsScreen)}
        options={{ tabBarIcon: ({ color }) => <TabIcon icon="👥" color={color} /> }}
      />
      <Tab.Screen
        name="Profil"
        component={withScreenBoundary(ProfileScreen)}
        options={{ tabBarIcon: ({ color }) => <TabIcon icon="👤" color={color} /> }}
      />
    </Tab.Navigator>
  )
}
