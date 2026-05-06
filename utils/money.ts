import { Colors } from '../constants/colors'

export function formatBalance(value: number): string {
  if (value > 0) return `+${value} zł`
  if (value < 0) return `${value} zł`
  return '0 zł'
}

export function getBalanceColor(value: number): string {
  if (value > 0) return Colors.green
  if (value < 0) return Colors.red
  return Colors.textMuted
}
