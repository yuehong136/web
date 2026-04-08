import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Form } from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { zodResolver } from '@hookform/resolvers/zod'
import { memo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { initialListOperationsValues } from '../../constant'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import { FormWrapper, Output, QueryVariable, transferOutputs } from '../components'
import { listOperationOptions } from './constants'

const listOperationsSchema = z.object({
  query: z.string().optional(),
  operations: z.string().optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

export const ListOperationsForm = memo(function ListOperationsForm({
  node,
}: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialListOperationsValues, node)

  const form = useForm({
    resolver: zodResolver(listOperationsSchema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const outputs = form.getValues('outputs')

  return (
    <Form {...form}>
      <FormWrapper>
        <QueryVariable />

        <FormField
          control={form.control}
          name="operations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.operation', 'Operation')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {listOperationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        />

        {outputs && <Output list={transferOutputs(outputs)} />}
      </FormWrapper>
    </Form>
  )
})
