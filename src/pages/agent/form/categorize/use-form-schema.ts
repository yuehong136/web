import { useTranslation } from 'react-i18next'
import { z } from 'zod'

export function useCreateCategorizeFormSchema() {
  const { t } = useTranslation()

  return z.object({
    llm_id: z.string().optional(),
    temperature: z.coerce.number().optional(),
    top_p: z.coerce.number().optional(),
    presence_penalty: z.coerce.number().optional(),
    frequency_penalty: z.coerce.number().optional(),
    max_tokens: z.coerce.number().optional(),
    query: z.string().optional(),
    parameter: z.string().optional(),
    message_history_window_size: z.coerce.number().optional(),
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
