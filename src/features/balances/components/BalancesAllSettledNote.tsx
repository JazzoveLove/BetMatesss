import { Text, View } from 'react-native'
import { Colors } from '@/shared/constants/colors'
import { pluralize } from '@/shared/utils/text'

export type BalancesAllSettledNoteProps = {
  friendCount: number
}

/** Tekst pod kartą "RAZEM 0 j." w STANIE B — są znajomi, ale nikt nic nie jest winien. */
export function BalancesAllSettledNote({ friendCount }: BalancesAllSettledNoteProps) {
  const friendsWord = pluralize(friendCount, ['znajomy', 'znajomych', 'znajomych'])

  return (
    <View style={{ alignItems: 'center', paddingHorizontal: 24 }} testID="balances-all-settled-note">
      <Text style={{ color: Colors.text, fontSize: 15, fontWeight: '600', textAlign: 'center' }}>
        Nikt nikomu nic nie jest winien
      </Text>
      <Text style={{ color: Colors.textMuted, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
        {`${friendCount} ${friendsWord}, zero otwartych rozliczeń.`}
      </Text>
    </View>
  )
}
