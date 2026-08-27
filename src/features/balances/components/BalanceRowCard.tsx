import { Image, Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '@/shared/constants/colors'
import { getInitials } from '@/shared/utils/text'
import { formatBalance, getBalanceColor } from '@/shared/utils/money'
import { friendRowSharedStyles } from '@/features/friends/components/styles/FriendStatCard.styles'
import type { BalanceRow } from '@/features/balances/types/balance.types'
import { styles } from './styles/BalanceRowCard.styles'

export type BalanceRowCardProps = {
  row: BalanceRow
  onPress: (id: string) => void
}

export function BalanceRowCard({ row, onPress }: BalanceRowCardProps) {
  return (
    <Pressable
      style={[friendRowSharedStyles.friendCard, styles.rowMarginBottom]}
      onPress={() => onPress(row.id)}
    >
      <View style={[friendRowSharedStyles.avatarBubble, styles.avatarClip]}>
        {row.avatarUrl ? (
          <Image source={{ uri: row.avatarUrl }} style={styles.avatarImage} />
        ) : (
          <Text style={friendRowSharedStyles.avatarInitials}>{getInitials(row.nick)}</Text>
        )}
      </View>
      <View style={friendRowSharedStyles.friendMiddle}>
        <Text style={friendRowSharedStyles.friendNick}>{row.nick}</Text>
        <Text style={styles.matchCount}>{row.matchCount} mecz.</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.balanceValue, { color: getBalanceColor(row.balance) }]}>
          {formatBalance(row.balance)}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </View>
    </Pressable>
  )
}
