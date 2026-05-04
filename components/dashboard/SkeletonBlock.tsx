import { View } from 'react-native'
import type { DimensionValue } from 'react-native'
import { Colors } from '../../constants/colors'

type Props = { width: DimensionValue; height: number; radius?: number }

export function SkeletonBlock({ width, height, radius = 8 }: Props) {
  return <View style={{ width, height, borderRadius: radius, backgroundColor: Colors.cardAlt }} />
}
