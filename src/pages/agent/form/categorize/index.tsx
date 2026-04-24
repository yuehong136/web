import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { type Resolver, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Form } from '@/components/ui/form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { initialCategorizeValues } from '../../constant'
import { useFormValues } from '../../hooks/use-form-values'
import type { INextOperatorForm } from '../../types'
import { FormWrapper, Output, QueryVariable, transferOutputs } from '../components'
import { LLMSelectField } from '../components/llm-select-field'
import { DynamicCategorize } from './dynamic-categorize'
import {
  type CategorizeFormValues,
  useCreateCategorizeFormSchema,
} from './use-form-schema'
import { useWatchFormChange } from './use-watch-change'

const outputList = transferOutputs(initialCategorizeValues.outputs)

export function CategorizeForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialCategorizeValues, node)
  const schema = useCreateCategorizeFormSchema()

  const form = useForm<CategorizeFormValues>({
    defaultValues: values as CategorizeFormValues,
    resolver: zodResolver(schema) as Resolver<CategorizeFormValues>,
  })

  useWatchFormChange(node?.id, form)

  const resolvedOutputList = useMemo(() => outputList, [])

  return (
    <Form {...form}>
      <FormWrapper>
        <QueryVariable />
        <LLMSelectField type="chat" valueMode="nameWithProvider" />

        <FormField
          control={form.control}
          name="message_history_window_size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('flow.messageHistoryWindowSize', 'Message History Window')}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  {...field}
                  value={field.value ?? 1}
                  onChange={(event) =>
                    field.onChange(Number(event.target.value))
                  }
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Separator />
        <DynamicCategorize nodeId={node?.id} />
        <Output list={resolvedOutputList} />
      </FormWrapper>
    </Form>
  )
}
