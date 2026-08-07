import type { PropsWithChildren } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useNavigation, type CompositeNavigationProp } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList, TabParamList } from '@/navigation/types'
import { styles } from './styles/DashboardGreeting.styles'

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
