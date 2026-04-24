import { useTranslation } from 'react-i18next'
import { z } from 'zod'

export function useCreateCategorizeFormSchema() {
  const { t } = useTranslation()

  return z.object({
    llm_id: z.string().optional(),
    temperature: z.number().optional(),
    top_p: z.number().optional(),
    presence_penalty: z.number().optional(),
    frequency_penalty: z.number().optional(),
    max_tokens: z.number().optional(),
    query: z.string().optional(),
    parameter: z.string().optional(),
    message_history_window_size: z.number().optional(),
    items: z
      .array(
        z.object({
          name: z.string().trim().min(1, t('flow.nameRequiredMsg', 'Name is required')),
          description: z.string().optional(),
          uuid: z.string(),
          examples: z
            .array(
              z.object({
                value: z.string(),
              }),
            )
            .optional(),
        }),
      )
      .default([]),
    outputs: z.record(z.string(), z.unknown()).optional(),
  })
}

export type CategorizeFormValues = z.infer<
  ReturnType<typeof useCreateCategorizeFormSchema>
>
