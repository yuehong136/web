import { z } from 'zod'

export enum ProfileMode {
  VIEW = 'view',
  EDIT_PROFILE = 'edit-profile',
  CHANGE_PASSWORD = 'change-password',
}

export const profileSchema = z.object({
  userName: z
    .string()
    .trim()
    .min(1, { message: 'settings.profile.validation.nameRequired' }),
  timeZone: z
    .string()
    .trim()
    .min(1, { message: 'settings.profile.validation.timeZoneRequired' }),
  avatar: z.string().optional().default(''),
})

export const passwordChangeSchema = z
  .object({
    currPasswd: z.string().trim().min(1, {
      message: 'settings.profile.validation.currentPasswordRequired',
    }),
    newPasswd: z
      .string()
      .trim()
      .min(8, { message: 'settings.profile.validation.newPasswordLength' }),
    confirmPasswd: z
      .string()
      .trim()
      .min(8, { message: 'settings.profile.validation.confirmPasswordLength' }),
  })
  .superRefine((data, ctx) => {
    if (data.newPasswd !== data.confirmPasswd) {
      ctx.addIssue({
        path: ['confirmPasswd'],
        message: 'settings.profile.validation.passwordMismatch',
        code: z.ZodIssueCode.custom,
      })
    }
  })

export type ProfileFormData = z.infer<typeof profileSchema>
export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>

export interface ProfileData extends ProfileFormData {
  email: string
}

export interface ProfileFormErrors {
  userName?: string
  timeZone?: string
  avatar?: string
}

export const defaultProfileData: ProfileData = {
  userName: '',
  avatar: '',
  timeZone: 'UTC+8\tAsia/Shanghai',
  email: '',
}
