import type { BetFormat } from '../types/bet.types'

export type FormatMeta = {
  id: BetFormat
  icon: string
  name: string
  description: string
}

export const BET_FORMATS: FormatMeta[] = [
  { id: 'single', icon: '⚔️', name: 'Jeden mecz', description: 'Jeden wynik rozstrzyga zakład' },
  { id: 'best_of', icon: '🏆', name: 'Best of X', description: 'Pierwszy do 2, 3 lub 4 wygranych' },
  { id: 'per_match', icon: '📊', name: 'Zakład za mecz', description: 'Każdy mecz to osobna stawka' },
  { id: 'round_robin', icon: '🔄', name: 'Round Robin', description: 'Każdy gra z każdym, ranking' },
  { id: 'elimination', icon: '🥊', name: 'Eliminacje', description: 'Drabinka — przegrany odpada' },
  { id: 'session', icon: '🎪', name: 'Sesja wielu gier', description: 'Kilka dyscyplin w jednym wieczorze' },
]

