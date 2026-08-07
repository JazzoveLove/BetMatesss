import { Colors } from '@/shared/constants/colors'

export function formatBalance(value: number): string {
  if (value > 0) return `+${value} j.`
  if (value < 0) return `${value} j.`
  return '0 j.'
}

export function getBalanceColor(value: number): string {
  if (value > 0) return Colors.green
  if (value < 0) return Colors.red
  return Colors.textMuted
}
