import type { PropsWithChildren } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useNavigation, type CompositeNavigationProp } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Colors } from '../../constants/colors'
import type { RootStackParamList, TabParamList } from '../../navigation/types'

type DashboardNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>

export type DashboardGreetingProps = PropsWithChildren<{
  nick: string
  avatarInitials: string
}>

export function DashboardGreeting({ nick, avatarInitials, children }: DashboardGreetingProps) {
  const navigation = useNavigation<DashboardNavProp>()
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.helloMuted}>Cześć,</Text>
        <Text style={styles.nick}>{nick}</Text>
        {children}
      </View>
      <View style={styles.headerRight}>
        <Pressable style={styles.iconButton}>
          <Text style={styles.iconText}>🔔</Text>
        </Pressable>
        <Pressable style={styles.avatarButton} onPress={() => navigation.navigate('Profil')}>
          <Text style={styles.avatarButtonText}>{avatarInitials}</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: { gap: 4 },
  helloMuted: { color: Colors.textMuted, fontSize: 12 },
  nick: { color: Colors.text, fontSize: 28, fontWeight: '700' },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { color: Colors.text, fontSize: 16 },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButtonText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
})
