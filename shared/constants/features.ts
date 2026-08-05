/** Przełączniki zakresu funkcjonalności — tymczasowo zawężamy UI do tego, co jest w pełni zaimplementowane. */

import type { BetFormat, StakeMode } from '../types/bet.types'

/** Formaty zakładu widoczne dla użytkownika. Pozostałe (best_of, session, per_match, round_robin, elimination) są zaimplementowane tylko częściowo. */
export const ENABLED_FORMATS: BetFormat[] = ['single']

/** Tryby stawki widoczne dla użytkownika. 'custom' wyłączony do czasu dodania walidacji kwot. */
export const ENABLED_STAKE_MODES: StakeMode[] = ['equal', 'none']
