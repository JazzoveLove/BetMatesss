import React from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { StyleSheet } from 'react-native'
import { Text, Button } from 'tamagui'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import DashboardScreen from '../app/dashboard'
import HistoryScreen from '../app/history'
import NewBetScreen from '../app/new-bet'
import FriendsScreen from '../app/friends'
import ProfileScreen from '../app/profile'
import { Colors } from '../constants/colors'
import { ScreenErrorFallback } from '../components/ScreenErrorFallback'

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
