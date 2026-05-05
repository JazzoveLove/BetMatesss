import { useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { RivalryBottomActions } from '../components/rivalry/RivalryBottomActions'
import { RivalryMatchesList } from '../components/rivalry/RivalryMatchesList'
import { RivalryTopBar } from '../components/rivalry/RivalryTopBar'
import { rivalryScreenStyles as styles } from '../components/rivalry/rivalryScreen.styles'
import { Colors } from '../constants/colors'
import { useRivalry } from '../hooks/useRivalry'
import { useRivalryScreenActions } from '../hooks/useRivalryScreenActions'
import type { RootStackParamList } from '../navigation/types'

type RivalryRouteProp = RouteProp<RootStackParamList, 'Rivalry'>

export default function RivalryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<RivalryRouteProp>()
  const insets = useSafeAreaInsets()
  const { friendId } = route.params
  const { loading, refreshing, matches, friendNick, onRefresh } = useRivalry(friendId)
  const { openNewBet, handleRematch } = useRivalryScreenActions({
    friendId,
    friendNick,
    matches,
    navigation,
  })
  const [activeGameId, setActiveGameId] = useState<string | null>(null)

  const chips = useMemo(() => [...new Set(matches.map(item => item.gameTemplate))], [matches])
  const filteredMatches = useMemo(() => {
    if (!activeGameId) return matches
    return matches.filter(item => item.gameTemplate === activeGameId)
  }, [activeGameId, matches])

  const heroStats = useMemo(() => {
    const wins = filteredMatches.filter(item => item.outcome === 'win').length
    const losses = filteredMatches.filter(item => item.outcome === 'loss').length
    const balance = filteredMatches.reduce((sum, item) => sum + item.profit, 0)
    const disciplines = new Set(filteredMatches.map(item => item.gameTemplate)).size
    return { wins, losses, balance, disciplines }
  }, [filteredMatches])

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.accentLight} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <RivalryTopBar friendNick={friendNick} onBack={() => navigation.goBack()} />
        <Pressable
          style={styles.iconBtn}
          onPress={() =>
            Alert.alert('Opcje', undefined, [
              { text: 'Usuń znajomego' },
              { text: 'Zablokuj' },
              { text: 'Anuluj', style: 'cancel' },
            ])
          }
        >
          <Text style={styles.iconBtnText}>···</Text>
        </Pressable>
      </View>
      <RivalryMatchesList
        filteredMatches={filteredMatches}
        refreshing={refreshing}
        onRefresh={onRefresh}
        friendNick={friendNick}
        heroStats={heroStats}
        chips={chips}
        selectedDiscipline={activeGameId}
        onSelectDiscipline={setActiveGameId}
      />
      <RivalryBottomActions
        paddingBottom={insets.bottom + 16}
        onNewBet={openNewBet}
        onRematch={() => void handleRematch()}
      />
    </SafeAreaView>
  )
}
