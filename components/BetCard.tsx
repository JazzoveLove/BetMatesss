import { XStack, YStack, Text } from 'tamagui'
import { GAME_MAP } from '../constants/games'

export type BetStatus =
  | 'pending'
  | 'active'
  | 'in_progress'
  | 'awaiting_confirmation'
  | 'completed'
  | 'disputed'

export type BetCardProps = {
  gameTemplate: string
  opponentNick: string
  stakeAmount: number
  odds: number
  status: BetStatus
  onPress?: () => void
}

const STATUS_CONFIG: Record<BetStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'Aktywny', color: '#7F77DD', bg: '#7F77DD18' },
  in_progress: { label: 'W toku', color: '#7F77DD', bg: '#7F77DD18' },
  pending: { label: 'Oczekuje', color: '#EF9F27', bg: '#EF9F2718' },
  awaiting_confirmation: { label: 'Do potwierdzenia', color: '#EF9F27', bg: '#EF9F2718' },
  completed: { label: 'Zakończony', color: 'rgba(232,230,224,0.5)', bg: '#1e2330' },
  disputed: { label: 'Spór', color: '#E24B4A', bg: '#E24B4A18' },
}

export default function BetCard({
  gameTemplate,
  opponentNick,
  stakeAmount,
  odds,
  status,
  onPress,
}: BetCardProps) {
  const game = GAME_MAP[gameTemplate] ?? { emoji: '🎲', label: gameTemplate }
  const statusCfg = STATUS_CONFIG[status]

  return (
    <XStack
      onPress={onPress}
      pressStyle={{ opacity: 0.75 }}
      style={{
        backgroundColor: '#181c24',
        borderRadius: 14,
        borderWidth: 0.5,
        borderColor: '#1e2330',
        padding: 14,
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}
    >
      <XStack flex={1} style={{ alignItems: 'center', gap: 12 }}>
        <Text style={{ fontSize: 28 }}>{game.emoji}</Text>
        <YStack flex={1}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#e8e6e0', marginBottom: 3 }}>
            {game.label}
          </Text>
          <Text style={{ fontSize: 12, color: 'rgba(232,230,224,0.5)' }}>vs {opponentNick}</Text>
        </YStack>
      </XStack>
      <YStack style={{ alignItems: 'flex-end', gap: 6 }}>
        <YStack
          style={{
            borderRadius: 20,
            paddingHorizontal: 9,
            paddingVertical: 3,
            backgroundColor: statusCfg.bg,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '600', color: statusCfg.color }}>
            {statusCfg.label}
          </Text>
        </YStack>
        <YStack style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#e8e6e0' }}>{stakeAmount} zł</Text>
          <Text style={{ fontSize: 11, color: 'rgba(232,230,224,0.5)' }}>
            × {odds.toFixed(2)}
          </Text>
        </YStack>
      </YStack>
    </XStack>
  )
}
