import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import type { GameTemplate } from '../../constants/games'
import type { NewBetHandlers, NewBetState } from '../../hooks/useNewBet'
import { Colors } from '../../constants/colors'
import { styles } from './newBetStepStyles'

type Props = {
  state: NewBetState
  onSelect: (game: GameTemplate) => void
  handlers: Pick<NewBetHandlers, 'setSearchQuery' | 'setSearchFocused'>
}

export function StepGame({ state, onSelect, handlers }: Props) {
  const { searchQuery, searchFocused, sectionData, gamesFiltered } = state

  return (
    <View style={styles.stepBody}>
      <TextInput
        placeholder="Szukaj gre..."
        placeholderTextColor={Colors.textMuted}
        value={searchQuery}
        onChangeText={handlers.setSearchQuery}
        onFocus={() => handlers.setSearchFocused(true)}
        onBlur={() => handlers.setSearchFocused(false)}
        style={styles.searchInput}
      />
      {!searchFocused && !searchQuery && (
        <ScrollView>
          {sectionData.map(section => (
            <View key={section.title}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.data.map(game => (
                <Pressable key={`${section.title}-${game.id}`} onPress={() => onSelect(game)} style={styles.gameRow}>
                  <Text style={styles.emoji}>{game.emoji}</Text>
                  <Text style={styles.gameName}>{game.name}</Text>
                  <Text style={styles.chevron}>{'>'}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
      {(searchFocused || !!searchQuery) && (
        <ScrollView>
          {gamesFiltered.map(game => (
            <Pressable key={game.id} onPress={() => onSelect(game)} style={styles.gameRow}>
              <Text style={styles.emoji}>{game.emoji}</Text>
              <Text style={styles.gameName}>{game.name}</Text>
              <Text style={styles.chevron}>{'>'}</Text>
            </Pressable>
          ))}
          {gamesFiltered.length === 0 && <Text style={styles.emptyState}>Dodaj "{searchQuery}" jako wlasna gre</Text>}
        </ScrollView>
      )}
    </View>
  )
}
