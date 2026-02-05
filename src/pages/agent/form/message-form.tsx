import { Form } from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { initialMessageValues } from '../constant'
import { useFormValues } from '../hooks/use-form-values'
import { useWatchFormChange } from '../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../types'
import { DynamicStringForm, FormWrapper } from './components'

const schema = z.object({
  content: z
    .array(z.object({ value: z.string() }))
    .optional(),
})

function normalizeContent(content: any): Array<{ value: string }> {
  if (!content) return [{ value: '' }]
  if (Array.isArray(content)) {
    return content.map((item) =>
      typeof item === 'string' ? { value: item } : item,
    )
  }
  return [{ value: '' }]
}

export function MessageForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const rawValues = useFormValues(initialMessageValues, node)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      ...rawValues,
      content: normalizeContent(rawValues?.content),
    },
  })

  useWatchFormChange(node?.id, form)

  return (
    <Form {...form}>
      <FormWrapper>
        <DynamicStringForm
          name="content"
          label={t('flow.message', 'Messages')}
        />
      </FormWrapper>
    </Form>
  )
}
