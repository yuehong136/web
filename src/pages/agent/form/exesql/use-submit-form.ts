import { agentAPI } from '@/api/agent'
import { toast } from '@/lib/toast'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'

const exeSqlBaseSchema = z.object({
  db_type: z.string().min(1, 'Database type is required'),
  database: z.string().min(1, 'Database is required'),
  username: z.string().min(1, 'Username is required'),
  host: z.string().min(1, 'Host is required'),
  port: z.number(),
  password: z.string().optional().or(z.literal('')),
  max_records: z.number(),
})

export const exeSqlSchema = exeSqlBaseSchema.extend({
  sql: z.string().optional(),
  outputs: z.record(z.string(), z.any()).optional(),
}).superRefine((value, ctx) => {
  if (value.db_type !== 'trino' && !(value.password && value.password.trim().length > 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Password is required',
      path: ['password'],
    })
  }
})

export type ExeSqlFormValues = z.infer<typeof exeSqlSchema>

export function useSubmitForm() {
  const mutation = useMutation({
    mutationFn: async (values: ExeSqlFormValues) => agentAPI.testDbConnect(values),
    onSuccess: () => {
      toast.success('数据库连接测试成功')
    },
    onError: (error: Error) => {
      toast.error(`数据库连接测试失败: ${error.message}`)
    },
  })

  return {
    testConnection: mutation.mutateAsync,
    isLoading: mutation.isPending,
  }
}
