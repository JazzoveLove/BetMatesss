import { z } from 'zod'

export function getFirstValidationError<Schema extends z.ZodTypeAny>(
  result: ReturnType<Schema['safeParse']>,
): string | null {
  if (result.success) return null
  return result.error.issues[0]?.message ?? 'Nieprawidłowe dane.'
}