import { View } from 'react-native'
import { styles } from './styles/ProfileSkeleton.styles'

function Skeleton({ height }: { height: number }) {
  return <View style={[styles.skeleton, { height }]} />
}

export function ProfileSkeleton() {
  return (
    <View>
      <View style={styles.avatarSection}>
        <Skeleton height={80} />
        <View style={{ marginTop: 12 }}><Skeleton height={24} /></View>
        <View style={{ marginTop: 4 }}><Skeleton height={16} /></View>
      </View>
      <View style={styles.statsRow}>
        <Skeleton height={72} />
        <Skeleton height={72} />
        <Skeleton height={72} />
      </View>
      <View style={styles.heroCard}><Skeleton height={160} /></View>
    </View>
  )
}
