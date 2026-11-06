import { z } from 'zod'

export const NICKNAME_MAX_LENGTH = 100
export const NICKNAME_PATTERN = /^[\p{L}\p{N} ._'-]+$/u

/** Matches the API: ECMAScript trim, Unicode code points, no normalization. */
export const nicknameSchema = z
  .string()
  .trim()
  .min(1, { message: 'settings.profile.validation.nameRequired' })
  .refine((value) => Array.from(value).length <= NICKNAME_MAX_LENGTH, {
    message: 'settings.profile.validation.nameMaxLength',
  })
  .regex(NICKNAME_PATTERN, {
    message: 'settings.profile.validation.nameInvalidCharacters',
  })
