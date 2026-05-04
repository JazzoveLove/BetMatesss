import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, TextInput, View } from 'react-native'
import { Colors } from '../../constants/colors'

export type FriendsSearchBarProps = {
  open: boolean
  value: string
  onChangeText: (text: string) => void
}

const styles = StyleSheet.create({
  searchWrap: { overflow: 'hidden', marginHorizontal: 16, marginTop: 8, marginBottom: 8 },
  searchInner: {
    height: 44,
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchIcon: { color: Colors.textMuted, fontSize: 14 },
  searchInput: { flex: 1, color: Colors.text, fontSize: 14, paddingVertical: 0 },
})

export function FriendsSearchBar({ open, value, onChangeText }: FriendsSearchBarProps) {
  const searchHeight = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(searchHeight, {
      toValue: open ? 44 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start()
  }, [searchHeight, open])

  return (
    <Animated.View style={[styles.searchWrap, { height: searchHeight }]}>
      <View style={styles.searchInner}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Szukaj znajomego..."
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
        />
      </View>
    </Animated.View>
  )
}
