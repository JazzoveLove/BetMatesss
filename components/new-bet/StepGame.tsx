import { useMemo, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { type GameTemplate } from '../../constants/games'
import type { NewBetHandlers, NewBetState } from '../../hooks/useNewBet'
import { GameTileGrid } from './game/GameTileGrid'
import { StepGameCustomSection } from './game/StepGameCustomSection'
import { StepGameFooter } from './game/StepGameFooter'
import { gameScreenStyles as styles } from './game/gameScreen.styles'
import { buildGamesMap, buildOrderedGames, buildTileDisplayById } from './game/stepGameTiles'

type Props = { state: NewBetState; onSelect: (game: GameTemplate) => void; handlers: Pick<NewBetHandlers, 'setSelectedFormat' | 'setStep'> }

export function StepGame({ state, onSelect, handlers }: Props) {
  const [customOpen, setCustomOpen] = useState(state.selectedGame?.id === 'wlasna')
  const [customName, setCustomName] = useState('')
  const gamesMap = useMemo(() => buildGamesMap(), [])
  const orderedGames = useMemo(() => buildOrderedGames(gamesMap), [gamesMap])
  const tileDisplayById = useMemo(() => buildTileDisplayById(), [])
  const recentGameIds = useMemo(() => new Set(state.recentGames.map(g => g.id)), [state.recentGames])
  const wlasnaGame = gamesMap.get('wlasna')
  const handleTilePress = (g: GameTemplate) => {
    setCustomOpen(false)
    setCustomName('')
    onSelect(g)
  }
  const selectedLabel = state.selectedGame?.id === 'wlasna' ? customName.trim() || 'Własna gra' : state.selectedGame?.name
  const scrollContent = { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 100 } as const
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>WYBIERZ DYSCYPLINĘ</Text>
      <ScrollView style={{ flex: 1 }} bounces showsVerticalScrollIndicator={false} contentContainerStyle={scrollContent}>
        <GameTileGrid games={orderedGames} tileDisplayById={tileDisplayById} recentGameIds={recentGameIds} selectedGameId={state.selectedGame?.id} onSelect={handleTilePress} />
        <StepGameCustomSection
          customOpen={customOpen}
          customName={customName}
          setCustomName={setCustomName}
          selectedIsWlasna={state.selectedGame?.id === 'wlasna'}
          wlasnaGame={wlasnaGame}
          onSelect={onSelect}
          onCustomOpen={() => {
            if (!wlasnaGame) return
            setCustomOpen(true)
            onSelect(wlasnaGame)
          }}
        />
      </ScrollView>
      <StepGameFooter
        canProceed={!!state.selectedGame}
        selectedLabel={selectedLabel}
        onNext={() => {
          if (!state.selectedGame) return
          handlers.setSelectedFormat(null)
          handlers.setStep(2)
        }}
      />
    </View>
  )
}
