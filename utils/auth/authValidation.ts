import { z } from 'zod'

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Wpisz adres e-mail.')
  .email('Podaj poprawny adres e-mail.')

export const passwordSchema = z
  .string()
  .min(1, 'Wpisz hasło.')
  .min(6, 'Hasło musi mieć co najmniej 6 znaków.')

export const credentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export function getFirstValidationError<Schema extends z.ZodTypeAny>(
    result: ReturnType<Schema['safeParse']>,
  ): string | null {
    if (result.success) return null
    return result.error.issues[0]?.message ?? 'Nieprawidłowe dane.'
  }