import { StyleSheet, View } from 'react-native'
import { Colors } from '../../constants/colors'

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

const styles = StyleSheet.create({
  skeleton: { width: '100%', borderRadius: 12, backgroundColor: Colors.cardAlt },
  avatarSection: { alignItems: 'center', marginTop: 20, marginBottom: 16 },
  statsRow: { marginHorizontal: 16, flexDirection: 'row', gap: 8 },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: 16,
  },
})
