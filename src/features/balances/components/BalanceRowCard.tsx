import { Image, Pressable, Text, View } from 'react-native'
import { getInitials, pluralize } from '@/shared/utils/text'
import { formatRowBalance } from '@/features/balances/utils/formatRowBalance'
import type { BalanceRow } from '@/features/balances/types/balance.types'
import { styles } from './styles/BalanceRowCard.styles'

export type BalanceRowCardProps = {
  row: BalanceRow
  onPress: (id: string) => void
  /** Ostatni wiersz listy nie dostaje separatora. */
  isLast?: boolean
}

export function BalanceRowCard({ row, onPress, isLast = false }: BalanceRowCardProps) {
  const amount = formatRowBalance(row.balance)
  const matchLabel = `${row.matchCount} ${pluralize(row.matchCount, ['mecz', 'mecze', 'meczów'])}`

  return (
    <Pressable style={[styles.row, !isLast && styles.rowDivider]} onPress={() => onPress(row.id)}>
      <View style={styles.avatar}>
        {row.avatarUrl ? (
          <Image source={{ uri: row.avatarUrl }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarInitials}>{getInitials(row.nick)}</Text>
        )}
      </View>

      <View style={styles.middle}>
        <Text style={styles.nick} numberOfLines={1}>
          {row.nick}
        </Text>
        <Text style={styles.matchCount}>{matchLabel}</Text>
      </View>

      <Text style={[styles.balanceValue, amount.isZero && styles.balanceZero, { color: amount.color }]}>
        {amount.text}
      </Text>
    </Pressable>
  )
}
