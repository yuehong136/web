import { z } from 'zod'

// 基础表单 Schema
export const baseSchema = z.object({
  userName: z.string().min(1, { message: '用户名不能为空' }).trim(),
  timeZone: z.string().min(1, { message: '请选择时区' }).trim(),
})

// 用户名编辑 Schema
export const nameSchema = baseSchema.extend({
  currPasswd: z.string().optional(),
  newPasswd: z.string().optional(),
  confirmPasswd: z.string().optional(),
})

// 密码编辑 Schema
export const passwordSchema = baseSchema
  .extend({
    currPasswd: z.string({ message: '请输入当前密码' }).trim().min(1, { message: '请输入当前密码' }),
    newPasswd: z.string({ message: '请输入新密码' }).trim().min(8, { message: '新密码至少需要8个字符' }),
    confirmPasswd: z.string({ message: '请确认新密码' }).trim().min(8, { message: '确认密码至少需要8个字符' }),
  })
  .superRefine((data, ctx) => {
    if (data.newPasswd && data.confirmPasswd && data.newPasswd !== data.confirmPasswd) {
      ctx.addIssue({
        path: ['confirmPasswd'],
        message: '两次输入的密码不一致',
        code: z.ZodIssueCode.custom,
      })
    }
  })

export type FormData = z.infer<typeof baseSchema> & {
  currPasswd?: string
  newPasswd?: string
  confirmPasswd?: string
}
