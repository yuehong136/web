import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { memo, useEffect } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import {
  StringTransformMethod,
  initialStringTransformValues,
} from '../../constant'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import { FormWrapper, Output, QueryVariable, transferOutputs } from '../components'
import {
  defaultStringTransformDelimiter,
  stringTransformMethodOptions,
} from './constants'
import { DelimiterList } from './components/delimiter-list'

const stringTransformSchema = z.object({
  method: z.string().optional(),
  split_ref: z.string().optional(),
  script: z.string().optional(),
  delimiters: z.array(z.string()).optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

export const StringTransformForm = memo(function StringTransformForm({
  node,
}: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialStringTransformValues, node)

  const form = useForm({
    resolver: zodResolver(stringTransformSchema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const method = useWatch({ control: form.control, name: 'method' })

  const { fields, append, remove } = useFieldArray({
    name: 'delimiters',
    control: form.control,
  })

  useEffect(() => {
    const isMerge = method === StringTransformMethod.Merge
    const outputs = {
      ...initialStringTransformValues.outputs,
      result: {
        type: isMerge ? 'string' : 'Array<string>',
      },
    }

    form.setValue('outputs', outputs, { shouldDirty: true })

    if (isMerge && (!form.getValues('delimiters') || fields.length === 0)) {
      form.setValue('delimiters', [defaultStringTransformDelimiter], {
        shouldDirty: true,
      })
    }
  }, [fields.length, form, method])

  const outputs = form.getValues('outputs')

  return (
    <Form {...form}>
      <FormWrapper>
        <FormField
          control={form.control}
          name="method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.method', 'Method')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stringTransformMethodOptions.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(`flow.${value}`, value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        />

        {method === StringTransformMethod.Split ? (
          <QueryVariable
            name="split_ref"
            label={t('flow.splitRef', 'Split Ref')}
          />
        ) : (
          <FormField
            control={form.control}
            name="script"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('flow.script', 'Script')}</FormLabel>
                <FormControl>
                  <Textarea rows={4} {...field} value={field.value ?? ''} />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        <DelimiterList
          control={form.control}
          fields={fields}
          onAppend={() => append(defaultStringTransformDelimiter)}
          onRemove={remove}
        />

        {outputs && <Output list={transferOutputs(outputs)} />}
      </FormWrapper>
    </Form>
  )
})
