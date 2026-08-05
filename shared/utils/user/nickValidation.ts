import { z } from 'zod'
import { BANNED_NICK_WORDS } from '../../constants/user/bannedNickWords'

export const nickSchema = z
  .string()
  .trim()
  .min(5, 'Nick musi mieć co najmniej 5 znaków.')
  .max(10, 'Nick może mieć maksymalnie 10 znaków.')
  .refine(
    value => !BANNED_NICK_WORDS.some(word => value.toLowerCase().includes(word)),
    'Ten nick zawiera niedozwolone słowo.',
  )