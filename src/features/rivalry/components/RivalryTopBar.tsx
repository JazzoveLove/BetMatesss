import { Pressable, Text, View } from 'react-native'
import { styles } from './styles/RivalryTopBar.styles'

export type RivalryTopBarProps = {
  friendNick: string
  onBack: () => void
}

export function RivalryTopBar({ friendNick, onBack }: RivalryTopBarProps) {
  return (
    <View style={styles.inner}>
      <Pressable style={styles.iconBtn} onPress={onBack}>
        <Text style={styles.iconBtnText}>{'<'}</Text>
      </Pressable>
      <Text style={styles.headerNick} numberOfLines={1}>
        {friendNick}
      </Text>
    </View>
  )
}
