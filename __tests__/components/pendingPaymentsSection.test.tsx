import { render, screen, fireEvent } from '@testing-library/react-native'
import { PendingPaymentsSection } from '@/features/friend-detail/components/PendingPaymentsSection'
import type { PairPendingPayment } from '@/features/friend-detail/api'

function payment(over: Partial<PairPendingPayment> = {}): PairPendingPayment {
  return {
    id: 'pay-1',
    fromUser: 'friend',
    toUser: 'me',
    amount: 40,
    createdBy: 'friend',
    createdAt: null,
    ...over,
  }
}

const noop = jest.fn()

describe('PendingPaymentsSection', () => {
  it('pusta lista → nic nie renderuje', () => {
    render(
      <PendingPaymentsSection
        userId="me"
        friendNick="Kuba"
        items={[]}
        busyId={null}
        onConfirm={noop}
        onReject={noop}
        onRetract={noop}
      />,
    )

    expect(screen.queryByTestId('pending-payments-section')).toBeNull()
  })

  it('jestem wierzycielem (to_user === userId) → Potwierdź / Odrzuć, wołają callbacki z id', () => {
    const onConfirm = jest.fn()
    const onReject = jest.fn()
    render(
      <PendingPaymentsSection
        userId="me"
        friendNick="Kuba"
        items={[payment({ id: 'pay-1', toUser: 'me', fromUser: 'friend' })]}
        busyId={null}
        onConfirm={onConfirm}
        onReject={onReject}
        onRetract={noop}
      />,
    )

    expect(screen.getByText(/Kuba oznaczył\(a\) spłatę 40 j\./)).toBeTruthy()
    fireEvent.press(screen.getByTestId('pending-payment-confirm-pay-1'))
    fireEvent.press(screen.getByTestId('pending-payment-reject-pay-1'))
    expect(onConfirm).toHaveBeenCalledWith('pay-1')
    expect(onReject).toHaveBeenCalledWith('pay-1')
    expect(screen.queryByTestId('pending-payment-retract-pay-1')).toBeNull()
  })

  it('to mój wpis (to_user !== userId) → tylko Wycofaj', () => {
    const onRetract = jest.fn()
    render(
      <PendingPaymentsSection
        userId="me"
        friendNick="Kuba"
        items={[payment({ id: 'pay-2', fromUser: 'me', toUser: 'friend', createdBy: 'me' })]}
        busyId={null}
        onConfirm={noop}
        onReject={noop}
        onRetract={onRetract}
      />,
    )

    expect(screen.getByText(/czeka na potwierdzenie/)).toBeTruthy()
    expect(screen.queryByTestId('pending-payment-confirm-pay-2')).toBeNull()
    fireEvent.press(screen.getByTestId('pending-payment-retract-pay-2'))
    expect(onRetract).toHaveBeenCalledWith('pay-2')
  })

  it('busyId === wiersz → spinner zamiast przycisków', () => {
    render(
      <PendingPaymentsSection
        userId="me"
        friendNick="Kuba"
        items={[payment({ id: 'pay-1', toUser: 'me' })]}
        busyId="pay-1"
        onConfirm={noop}
        onReject={noop}
        onRetract={noop}
      />,
    )

    expect(screen.queryByTestId('pending-payment-confirm-pay-1')).toBeNull()
  })
})
