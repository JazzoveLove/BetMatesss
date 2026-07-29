import { useState } from 'react'
import { handleFriendInvite, lookupUserByCode } from '../services/friends/friends.invite'

function formatCodeInputField(raw: string): string {
  const cleaned = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8)
  if (cleaned.length <= 4) return cleaned
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`
}

function inviteResultSuccessMessage(
  type: 'sent' | 'accepted' | 'already_friends' | 'already_sent',
): string {
  switch (type) {
    case 'sent': return 'Zaproszenie zostało wysłane.'
    case 'accepted': return 'Jesteście teraz znajomymi.'
    case 'already_friends': return 'Ta osoba jest już na liście znajomych.'
    case 'already_sent': return 'Zaproszenie już czeka na akceptację.'
  }
}

export function useAddFriendByCode(me: string | null, onSuccess: () => void) {
  const [codeInput, setCodeInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [fieldSuccess, setFieldSuccess] = useState<string | null>(null)

  const codeWithoutDash = codeInput.replace(/-/g, '')
  const disabled = codeWithoutDash.length < 6 || !me || loading

  function onCodeChange(text: string) {
    setFieldError(null)
    setFieldSuccess(null)
    setCodeInput(formatCodeInputField(text))
  }

  async function onSubmit() {
    if (!me || disabled) return
    setFieldError(null)
    setFieldSuccess(null)
    setLoading(true)
    try {
      const lookup = await lookupUserByCode(codeWithoutDash)
      if ('error' in lookup) {
        if (lookup.missingFunction) {
          setFieldError('Uruchom w Supabase skrypt z pliku supabase/users_invite_code.sql.')
        } else if (lookup.error === 'not_found') {
          setFieldError('Nie znaleziono użytkownika o tym kodzie.')
        } else {
          setFieldError(lookup.error)
        }
        return
      }
      const result = await handleFriendInvite(me, lookup.userId)
      if (
        result.type === 'sent' ||
        result.type === 'accepted' ||
        result.type === 'already_friends' ||
        result.type === 'already_sent'
      ) {
        setFieldSuccess(inviteResultSuccessMessage(result.type))
        setCodeInput('')
        onSuccess()
        return
      }
      if (result.type === 'self') { setFieldError('Nie możesz dodać samego siebie.'); return }
      if (result.type === 'not_found') { setFieldError('Nie znaleziono użytkownika.'); return }
      if (result.type === 'missing_function') { setFieldError('Brak funkcji w bazie. Uruchom skrypt SQL.'); return }
      if (result.type === 'duplicate') { setFieldError('Taka relacja jest już zapisana.'); return }
      if (result.type === 'error') { setFieldError(result.message); return }
    } catch {
      setFieldError('Nie udało się dodać znajomego. Spróbuj ponownie.')
    } finally {
      setLoading(false)
    }
  }

  return { codeInput, onCodeChange, onSubmit, loading, fieldError, fieldSuccess, disabled }
}
