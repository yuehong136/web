import { z } from 'zod'

export enum ProfileMode {
  VIEW = 'view',
  EDIT_PROFILE = 'edit-profile',
  CHANGE_PASSWORD = 'change-password',
}

export const profileSchema = z.object({
  userName: z.string().trim().min(1, { message: '用户名不能为空' }),
  timeZone: z.string().trim().min(1, { message: '请选择时区' }),
  avatar: z.string().optional().default(''),
})

export const passwordChangeSchema = z
  .object({
    currPasswd: z.string().trim().min(1, { message: '请输入当前密码' }),
    newPasswd: z.string().trim().min(8, { message: '新密码至少需要8个字符' }),
    confirmPasswd: z.string().trim().min(8, { message: '确认密码至少需要8个字符' }),
  })
  .superRefine((data, ctx) => {
    if (data.newPasswd !== data.confirmPasswd) {
      ctx.addIssue({
        path: ['confirmPasswd'],
        message: '两次输入的密码不一致',
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
