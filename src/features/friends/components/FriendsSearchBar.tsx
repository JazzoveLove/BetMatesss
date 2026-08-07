import { useEffect, useRef } from 'react'
import { Animated, Text, TextInput, View } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import { styles } from './styles/FriendsSearchBar.styles'

export type FriendsSearchBarProps = {
  open: boolean
  value: string
  onChangeText: (text: string) => void
}

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
