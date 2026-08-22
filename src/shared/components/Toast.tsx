import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Text, View } from 'react-native'
import { styles } from './styles/Toast.styles'

const TOAST_DURATION_MS = 2000

type ToastContextValue = {
  showToast: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((text: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setMessage(text)
    timeoutRef.current = setTimeout(() => setMessage(null), TOAST_DURATION_MS)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message !== null && (
        <View style={styles.wrap} pointerEvents="none">
          <View style={styles.toast}>
            <Text style={styles.text}>{message}</Text>
          </View>
        </View>
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast musi być użyty wewnątrz ToastProvider')
  return ctx
}
