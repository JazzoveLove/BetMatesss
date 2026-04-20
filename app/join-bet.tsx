import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert } from 'react-native'
import { YStack, XStack, Text, Button } from 'tamagui'
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
      <YStack flex={1} style={{ backgroundColor: '#0f1117', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#7F77DD" size="large" />
      </YStack>
    )
  }

  if (!preview) {
    return (
      <YStack flex={1} style={{ backgroundColor: '#0f1117', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'rgba(232,230,224,0.5)', fontSize: 15 }}>Nie udało się odczytać zaproszenia.</Text>
      </YStack>
    )
  }

  const game = GAME_MAP[preview.gameTemplate] ?? { emoji: '🎲', label: preview.gameTemplate }

  return (
    <YStack flex={1} style={{ backgroundColor: '#0f1117', padding: 20, justifyContent: 'center' }}>
      <YStack
        style={{
          backgroundColor: '#181c24',
          borderRadius: 16,
          borderColor: '#1e2330',
          borderWidth: 0.5,
          padding: 20,
          gap: 14,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#e8e6e0', marginBottom: 8 }}>{preview.title}</Text>
        <XStack style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 13, color: 'rgba(232,230,224,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Gra
          </Text>
          <Text style={{ fontSize: 16, color: '#e8e6e0', fontWeight: '600' }}>
            {game.emoji} {game.label}
          </Text>
        </XStack>
        <XStack style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 13, color: 'rgba(232,230,224,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Stawka
          </Text>
          <Text style={{ fontSize: 16, color: '#e8e6e0', fontWeight: '600' }}>{preview.stakeAmount} zł</Text>
        </XStack>
        <Button
          disabled={joining}
          onPress={handleJoin}
          style={{
            marginTop: 10,
            backgroundColor: '#534AB7',
            borderRadius: 12,
            height: 52,
            opacity: joining ? 0.65 : 1,
          }}
        >
          {joining ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
              {preview.alreadyConfirmed ? 'Przejdź do zakładu' : 'Dołącz do zakładu'}
            </Text>
          )}
        </Button>
      </YStack>
    </YStack>
  )
}
