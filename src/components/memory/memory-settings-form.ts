import { z } from 'zod'
import type { TFunction } from 'i18next'
import type { Memory } from '@/types/memory'

export const getMemorySettingsSchema = (t: TFunction) =>
  z.object({
    name: z.string().trim().min(1, t('memory.validation.nameRequired')),
    description: z.string(),
    avatar: z.string(),
    memory_type: z
      .array(z.string())
      .min(1, t('memory.validation.memoryTypeRequired'))
      .refine((types) => types.includes('raw'), {
        message: t('memory.validation.rawRequired'),
      }),
    permissions: z.enum(['me', 'team']),
    llm_id: z.string().min(1, t('memory.validation.selectLlmRequired')),
    memory_size: z.number().min(1048576).max(104857600),
    forgetting_policy: z.enum(['FIFO', 'LRU']),
    temperature: z.number().min(0).max(1),
    system_prompt: z.string(),
    user_prompt: z.string(),
  })

export type MemorySettingsValues = z.infer<
  ReturnType<typeof getMemorySettingsSchema>
>

export function getMemorySettingsValues(config?: Memory): MemorySettingsValues {
  return {
    name: config?.name ?? '',
    description: config?.description ?? '',
    avatar: config?.avatar ?? '',
    memory_type: config?.memory_type ?? ['raw'],
    permissions: config?.permissions ?? 'me',
    llm_id: config?.llm_id ?? '',
    memory_size: config?.memory_size ?? 5242880,
    forgetting_policy: config?.forgetting_policy ?? 'FIFO',
    temperature: config?.temperature ?? 0.7,
    system_prompt: config?.system_prompt ?? '',
    user_prompt: config?.user_prompt ?? '',
  }
}
