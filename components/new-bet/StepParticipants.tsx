import { Pressable, ScrollView, SectionList, Text, View } from 'react-native'
import type { NewBetHandlers, NewBetState } from '../../hooks/useNewBet'
import { styles } from './newBetStepStyles'

type Props = {
  state: NewBetState
  handlers: NewBetHandlers
}

export function StepParticipants({ state, handlers }: Props) {
  const { participants, friendProfiles, totalPlayers } = state

  return (
    <View style={styles.stepBody}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
        {participants.map(p => (
          <View key={p.id} style={styles.participantChip}>
            <Text style={styles.avatarText}>{p.nick[0]?.toUpperCase()}</Text>
            <Text style={styles.participantNick}>{p.nick}</Text>
            <Pressable onPress={() => handlers.setParticipants(prev => prev.filter(u => u.id !== p.id))}>
              <Text style={styles.removeText}>x</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <SectionList
        sections={[{ title: 'Znajomi', data: friendProfiles }]}
        keyExtractor={item => item.id}
        renderSectionHeader={({ section }) => <Text style={styles.sectionTitle}>{section.title}</Text>}
        renderItem={({ item }) => {
          const selected = participants.some(p => p.id === item.id)
          return (
            <Pressable
              onPress={() => handlers.toggleParticipant(item)}
              style={[styles.friendRow, selected && styles.friendRowSelected]}
            >
              <Text style={styles.avatarText}>{item.nick[0]?.toUpperCase()}</Text>
              <Text style={styles.friendNick}>{item.nick}</Text>
              {selected && <Text style={styles.check}>OK</Text>}
            </Pressable>
          )
        }}
      />

      <View style={styles.stickyFooter}>
        <Pressable
          onPress={() => handlers.setStep(3)}
          disabled={participants.length === 0}
          style={[styles.button, participants.length === 0 && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>
            {participants.length === 0
              ? 'Wybierz uczestnikow'
              : participants.length === 1
                ? `Dalej z ${participants[0].nick} ->`
                : `Dalej (${totalPlayers} graczy) ->`}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
