import { useMemo, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { Colors } from '../../../constants/colors'
import type { NewBetHandlers, NewBetState } from '../../../hooks/useNewBet'
import type { UserProfile } from '../../../types/user.types'
import { stakeStepStyles } from './stakeStyles'
import { stepStakeStyles as styles } from './stepStake.styles'

const ACTIVITY_LABELS = ['wczoraj', '3 dni temu', 'tydzień temu'] as const

function initialsFromNick(nick: string): string {
  const parts = nick.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export type StepStakeParticipantsSectionProps = {
  state: Pick<NewBetState, 'participants' | 'friendProfiles' | 'customStakes' | 'stakeMode'>
  handlers: Pick<NewBetHandlers, 'toggleParticipant' | 'setCustomStakes'>
}

export function StepStakeParticipantsSection({ state, handlers }: StepStakeParticipantsSectionProps) {
  const [search, setSearch] = useState('')
  const { participants, friendProfiles, customStakes, stakeMode } = state

  const selectedIds = useMemo(() => new Set(participants.map(p => p.id)), [participants])
  const friendsSorted = useMemo(() => {
    const list = [...friendProfiles]
    list.sort((a, b) => {
      const aSelected = selectedIds.has(a.id) ? 0 : 1
      const bSelected = selectedIds.has(b.id) ? 0 : 1
      return aSelected - bSelected || a.nick.localeCompare(b.nick)
    })
    return list
  }, [friendProfiles, selectedIds])

  const friendsFiltered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return friendsSorted
    return friendsSorted.filter(friend => friend.nick.toLowerCase().includes(q))
  }, [friendsSorted, search])

  const patchCustom = (id: string, amount: number) => {
    handlers.setCustomStakes(prev => ({ ...prev, [id]: amount }))
  }

  return (
    <>
      <Text style={[stakeStepStyles.sectionLabel, { marginTop: 16 }]}>DODAJ UCZESTNIKÓW</Text>
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Szukaj znajomego..."
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
        />
      </View>
      {friendsFiltered.map((friend: UserProfile, index: number) => {
        const selected = selectedIds.has(friend.id)
        return (
          <Pressable key={friend.id} onPress={() => handlers.toggleParticipant(friend)} style={[styles.friendRow, selected && styles.friendRowSelected]}>
            <View style={styles.friendAvatar}>
              <Text style={styles.friendAvatarText}>{initialsFromNick(friend.nick)}</Text>
            </View>
            <View style={styles.friendCenter}>
              <Text style={styles.friendNick}>{friend.nick}</Text>
              <Text style={styles.friendActivity}>{ACTIVITY_LABELS[index % ACTIVITY_LABELS.length]}</Text>
            </View>
            {stakeMode === 'custom' && (
              <View style={styles.friendStakeWrap}>
                <TextInput
                  keyboardType="numeric"
                  value={customStakes[friend.id] ? String(customStakes[friend.id]) : ''}
                  onChangeText={v => patchCustom(friend.id, Number(v) || 0)}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  style={styles.friendStakeInput}
                />
                <Text style={styles.friendStakeSuffix}>zł</Text>
              </View>
            )}
            <View style={[styles.checkbox, selected && styles.checkboxSelected]}>{selected && <Text style={styles.checkboxText}>✓</Text>}</View>
          </Pressable>
        )
      })}
    </>
  )
}
