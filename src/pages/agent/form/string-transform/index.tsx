import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { MultiSelectWithSearch } from '@/components/ui/multi-select-with-search'
import { SelectWithSearch } from '@/components/ui/select-with-search'
import { zodResolver } from '@hookform/resolvers/zod'
import { memo, useCallback, useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { PromptEditor } from '@/components/prompt-editor'
import {
  StringTransformDelimiter,
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
  const delimiterOptionGroups = useMemo(
    () => [
      {
        label: t('flow.delimiters', 'Delimiters'),
        options: Object.entries(StringTransformDelimiter).map(([key, value]) => ({
          label: t(`flow.${key.charAt(0).toLowerCase()}${key.slice(1)}`, value),
          value,
        })),
      },
    ],
    [t],
  )
  const methodOptions = useMemo(
    () =>
      stringTransformMethodOptions.map((value) => ({
        label: t(`flow.${value}`, value),
        value,
      })),
    [t],
  )

  const form = useForm({
    resolver: zodResolver(stringTransformSchema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const method = useWatch({ control: form.control, name: 'method' })
  const delimiterValues = useWatch({ control: form.control, name: 'delimiters' })

  const buildOutputs = useCallback((value?: string) => {
    const isMerge = value === StringTransformMethod.Merge
    return {
      ...initialStringTransformValues.outputs,
      result: {
        type: isMerge ? 'string' : 'Array<string>',
      },
    }
  }, [])

  const handleMethodChange = useCallback(
    (value: string) => {
      const isMerge = value === StringTransformMethod.Merge
      form.setValue('method', value, { shouldDirty: true })
      form.setValue('outputs', buildOutputs(value), { shouldDirty: true })
      form.setValue(
        'delimiters',
        isMerge ? [defaultStringTransformDelimiter] : [],
        { shouldDirty: true },
      )
    },
    [buildOutputs, form],
  )

  useEffect(() => {
    const nextDelimiterValues = Array.isArray(delimiterValues) ? delimiterValues : []

    if (!method) {
      return
    }

    form.setValue('outputs', buildOutputs(method), { shouldDirty: true })

    if (
      method === StringTransformMethod.Merge &&
      nextDelimiterValues.length === 0
    ) {
      form.setValue('delimiters', [defaultStringTransformDelimiter], {
        shouldDirty: true,
      })
    }
  }, [buildOutputs, delimiterValues, form, method])

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
                <SelectWithSearch
                  value={field.value ?? StringTransformMethod.Merge}
                  onChange={handleMethodChange}
                  options={methodOptions}
                />
              </FormControl>
              <FormMessage />
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
                  <PromptEditor
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    showToolbar={false}
                    nodeId={node?.id}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="delimiters"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.delimiters', 'Delimiters')}</FormLabel>
              <FormControl>
                {method === StringTransformMethod.Split ? (
                  <MultiSelectWithSearch
                    options={delimiterOptionGroups}
                    value={Array.isArray(field.value) ? field.value : []}
                    onChange={field.onChange}
                  />
                ) : (
                  <SelectWithSearch
                    options={delimiterOptionGroups}
                    value={Array.isArray(field.value) ? (field.value[0] ?? '') : ''}
                    onChange={(value) => field.onChange(value ? [value] : [])}
                  />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {outputs && <Output list={transferOutputs(outputs)} />}
      </FormWrapper>
    </Form>
  )
})
