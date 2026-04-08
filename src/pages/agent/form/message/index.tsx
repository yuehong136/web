import { Form } from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import type { INextOperatorForm } from '../../types'
import { DynamicStringForm, FormWrapper } from '../components'
import {
  useMessageFormValues,
  useWatchMessageFormChange,
} from './hooks'

const schema = z.object({
  content: z
    .array(z.object({ value: z.string() }))
    .optional(),
})

export function MessageForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useMessageFormValues(node)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: values,
  })

  useWatchMessageFormChange(node?.id, form)

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
