import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SelectWithSearch } from '@/components/ui/select-with-search'
import { Separator } from '@/components/ui/separator'
import { zodResolver } from '@hookform/resolvers/zod'
import { memo, useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import {
  ArrayFields,
  ComparisonOperator,
  DataOperationsOperatorOptions,
  ListOperations,
  SortMethod,
  initialListOperationsValues,
} from '../../constant'
import { useFormValues } from '../../hooks/use-form-values'
import { useBuildPromptVariableOptions } from '../../hooks/use-get-begin-query'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import {
  FormWrapper,
  Output,
  QueryVariable,
  buildOutputList,
} from '../components'
import { findQueryVariableOption } from '../components/query-variable-utils'
import { listOperationOptions } from './constants'

const listOperationsSchema = z.object({
  query: z.string().optional(),
  operations: z.string().optional(),
  n: z.coerce.number().optional(),
  sort_method: z.string().optional(),
  filter: z
    .object({
      operator: z.string().optional(),
      value: z.string().optional(),
    })
    .optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

function getArrayElementType(type?: string) {
  if (!type) {
    return 'unknown'
  }

  const normalized = type.trim()
  const match = normalized.match(/^array<(.+)>$/i)

  if (match?.[1]) {
    return match[1]
  }

  if (normalized.toLowerCase() === 'array') {
    return 'unknown'
  }

  return normalized
}

function buildListOutputs(itemType: string) {
  return {
    result: {
      type: `Array<${itemType}>`,
    },
    first: {
      type: itemType,
    },
    last: {
      type: itemType,
    },
  }
}

const countOperations = new Set<string>([
  ListOperations.TopN,
  ListOperations.Head,
  ListOperations.Tail,
])

export const ListOperationsForm = memo(function ListOperationsForm({
  node,
}: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialListOperationsValues, node)
  const optionGroups = useBuildPromptVariableOptions(node?.id)

  const form = useForm({
    resolver: zodResolver(listOperationsSchema),
    defaultValues: values,
  })

  const operation = useWatch({
    control: form.control,
    name: 'operations',
  })
  const query = useWatch({
    control: form.control,
    name: 'query',
  })

  const selectedOption = useMemo(
    () => findQueryVariableOption(optionGroups, query),
    [optionGroups, query],
  )
  const itemType = useMemo(
    () => getArrayElementType((selectedOption as { type?: string } | undefined)?.type),
    [selectedOption],
  )
  const outputs = useMemo(() => buildListOutputs(itemType), [itemType])

  useEffect(() => {
    form.setValue('outputs', outputs, { shouldDirty: true })

    if (countOperations.has(operation as string) && !form.getValues('n')) {
      form.setValue('n', 1, { shouldDirty: true })
    }

    if (operation === ListOperations.Sort && !form.getValues('sort_method')) {
      form.setValue('sort_method', SortMethod.Asc, { shouldDirty: true })
    }

    if (
      operation === ListOperations.Filter &&
      !form.getValues('filter.operator')
    ) {
      form.setValue('filter.operator', ComparisonOperator.Equal, {
        shouldDirty: true,
      })
    }
  }, [form, operation, outputs])

  useWatchFormChange(node?.id, form)

  return (
    <Form {...form}>
      <FormWrapper>
        <QueryVariable
          name="query"
          label={t('flow.query', 'Query')}
          types={ArrayFields as unknown as string[]}
        />

        <Separator />

        <FormField
          control={form.control}
          name="operations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.operations', 'Operations')}</FormLabel>
              <FormControl>
                <SelectWithSearch
                  value={field.value || ListOperations.TopN}
                  onChange={field.onChange}
                  options={listOperationOptions}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {countOperations.has(operation as string) && (
          <FormField
            control={form.control}
            name="n"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('flow.flowNum', 'Count')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
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
        )}

        {operation === ListOperations.Sort && (
          <FormField
            control={form.control}
            name="sort_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('flow.sortMethod', 'Sort method')}</FormLabel>
                <FormControl>
                  <SelectWithSearch
                    value={field.value || SortMethod.Asc}
                    onChange={field.onChange}
                    options={Object.values(SortMethod).map((value) => ({
                      label: value,
                      value,
                    }))}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {operation === ListOperations.Filter && (
          <div className="grid grid-cols-1 gap-space-md md:grid-cols-[0.8fr_1fr]">
            <FormField
              control={form.control}
              name="filter.operator"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('flow.operator', 'Operator')}</FormLabel>
                  <FormControl>
                    <SelectWithSearch
                      value={field.value || ComparisonOperator.Equal}
                      onChange={field.onChange}
                      options={DataOperationsOperatorOptions.map((value) => ({
                        label: value,
                        value,
                      }))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="filter.value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('flow.value', 'Value')}</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        )}

        <Output list={buildOutputList(outputs)} />
      </FormWrapper>
    </Form>
  )
})
