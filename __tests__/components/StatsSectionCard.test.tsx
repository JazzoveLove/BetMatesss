import React from 'react'
import { render } from '@testing-library/react-native'
import { StatsSectionCard } from '../../components/profile/StatsSectionCard'
import { Colors } from '../../constants/colors'

describe('StatsSectionCard', () => {
  it('renderuje tytuł i ikonę', () => {
    const { getByText } = render(
      <StatsSectionCard icon="💰" title="Zakłady na pieniądze" wins={3} losses={1} winrate={75} />,
    )
    expect(getByText('💰 Zakłady na pieniądze')).toBeTruthy()
  })

  it('pokazuje poprawny winrate', () => {
    const { getByText } = render(
      <StatsSectionCard icon="🤝" title="Mecze towarzyskie" wins={2} losses={2} winrate={50} />,
    )
    expect(getByText(/50% winrate/)).toBeTruthy()
  })

  it('pokazuje wins i losses', () => {
    const { getByText } = render(
      <StatsSectionCard icon="💰" title="Test" wins={5} losses={2} winrate={71} />,
    )
    expect(getByText('5W')).toBeTruthy()
    expect(getByText(/\/ 2P/)).toBeTruthy()
  })

  it('pokazuje bilans gdy balance jest podane', () => {
    const { getByText } = render(
      <StatsSectionCard icon="💰" title="Test" wins={3} losses={1} winrate={75} balance={40} />,
    )
    expect(getByText('Bilans: +40 zł')).toBeTruthy()
  })

  it('bilans ma kolor zielony dla wartości dodatnich', () => {
    const { getByText } = render(
      <StatsSectionCard icon="💰" title="Test" wins={3} losses={1} winrate={75} balance={40} />,
    )
    expect(getByText('Bilans: +40 zł')).toHaveStyle({ color: Colors.green })
  })

  it('bilans ma kolor czerwony dla wartości ujemnych', () => {
    const { getByText } = render(
      <StatsSectionCard icon="💰" title="Test" wins={1} losses={3} winrate={25} balance={-20} />,
    )
    expect(getByText('Bilans: -20 zł')).toHaveStyle({ color: Colors.red })
  })

  it('ukrywa wiersz bilansu gdy balance = undefined', () => {
    const { queryByText } = render(
      <StatsSectionCard icon="🤝" title="Mecze towarzyskie" wins={2} losses={2} winrate={50} />,
    )
    expect(queryByText(/Bilans/)).toBeNull()
  })

  it('ukrywa wiersz bilansu gdy balance nie jest przekazane (towarzyskie)', () => {
    const { queryByText } = render(
      <StatsSectionCard icon="🤝" title="Mecze towarzyskie" wins={4} losses={1} winrate={80} />,
    )
    expect(queryByText(/Bilans/)).toBeNull()
  })
})
