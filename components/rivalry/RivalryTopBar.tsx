import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors } from '../../constants/colors'

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

const styles = StyleSheet.create({
  inner: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  headerNick: {
    flex: 1,
    textAlign: 'center',
    color: Colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginHorizontal: 12,
  },
})
