import { Colors } from '@/shared/constants/colors'

export function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '')
  const value = Number.parseInt(cleanHex, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
