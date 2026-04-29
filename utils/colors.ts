import { Colors } from '../constants/colors'

/**
 * Konwertuje kolor hex z Colors na rgba z podaną opacity.
 * Przykład: hexToRgba(Colors.amber, 0.15) → "rgba(239, 159, 39, 0.15)"
 */
export function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '')
  const value = Number.parseInt(cleanHex, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
