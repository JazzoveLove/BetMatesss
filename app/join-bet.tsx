import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { BetsService } from '../services/bets.service'
import { AuthService } from '../services/auth.service'
import { GAME_MAP } from '../constants/games'
import { ensureFriendshipAccepted } from '../services/friends.service'

type RootParamList = { JoinBet: { code: string } }

type InvitePreview = {
  betId: string
  title: string
  gameTemplate: string
  stakeAmount: number
  creatorId: string
  alreadyConfirmed: boolean
}

export default function JoinBetScreen() {
  const route = useRoute<RouteProp<RootParamList, 'JoinBet'>>()
  const navigation = useNavigation<any>()
  const { code } = route.params

  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [preview, setPreview] = useState<InvitePreview | null>(null)

  const loadPreview = useCallback(async () => {
    const userId = await AuthService.getCurrentUserId()
    if (!userId) {
      setLoading(false)
      return
    }
    setCurrentUserId(userId)
    const res = await BetsService.getBetInvitePreview(code, userId)
    if ('error' in res) {
      Alert.alert('Błąd', res.error)
      setLoading(false)
      return
    }
    setPreview({
      betId: res.betId,
      title: res.title,
      gameTemplate: res.gameTemplate,
      stakeAmount: res.stakeAmount,
      creatorId: res.creatorId,
      alreadyConfirmed: res.alreadyConfirmed,
    })
    setLoading(false)
  }, [code])

  useEffect(() => {
    void loadPreview()
  }, [loadPreview])

  const handleJoin = useCallback(async () => {
    if (!currentUserId || !preview) return
    setJoining(true)
    const joinRes = await BetsService.joinBetFromInvite(code, currentUserId)
    if ('error' in joinRes) {
      setJoining(false)
      Alert.alert('Błąd', joinRes.error)
      return
    }

    const friendRes = await ensureFriendshipAccepted(currentUserId, preview.creatorId)
    setJoining(false)
    if (friendRes.error) {
      Alert.alert('Dołączono do zakładu', 'Dołączono, ale nie udało się automatycznie dodać do znajomych.')
      navigation.replace('BetDetail', { betId: joinRes.betId })
      return
    }
    navigation.replace('BetDetail', { betId: joinRes.betId })
  }, [code, currentUserId, navigation, preview])

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#7F77DD" size="large" />
      </View>
    )
  }

  if (!preview) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Nie udało się odczytać zaproszenia.</Text>
      </View>
    )
  }

  const game = GAME_MAP[preview.gameTemplate] ?? { emoji: '🎲', label: preview.gameTemplate }

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>{preview.title}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Gra</Text>
          <Text style={styles.value}>{game.emoji} {game.label}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Stawka</Text>
          <Text style={styles.value}>{preview.stakeAmount} zł</Text>
        </View>
        <TouchableOpacity
          style={[styles.joinBtn, joining && styles.joinBtnDisabled]}
          onPress={handleJoin}
          disabled={joining}
          activeOpacity={0.85}
        >
          {joining
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.joinBtnText}>
                {preview.alreadyConfirmed ? 'Przejdź do zakładu' : 'Dołącz do zakładu'}
              </Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f1117', padding: 20, justifyContent: 'center' },
  centered: { flex: 1, backgroundColor: '#0f1117', justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'rgba(232,230,224,0.5)', fontSize: 15 },
  card: {
    backgroundColor: '#181c24',
    borderRadius: 16,
    borderColor: '#1e2330',
    borderWidth: 0.5,
    padding: 20,
    gap: 14,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#e8e6e0', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 13, color: 'rgba(232,230,224,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 16, color: '#e8e6e0', fontWeight: '600' },
  joinBtn: {
    marginTop: 10,
    backgroundColor: '#534AB7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  joinBtnDisabled: { opacity: 0.65 },
  joinBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
