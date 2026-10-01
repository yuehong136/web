import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SelectWithSearch } from '@/components/ui/select-with-search'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
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
  ListOperationsVersion,
  SortMethod,
} from '../../constant'
import { useBuildPromptVariableOptions } from '../../hooks/use-get-begin-query'
import { useFormBinding } from '../../hooks/use-form-binding'
import type { INextOperatorForm } from '../../types'
import {
  FormWrapper,
  Output,
  QueryVariable,
  buildOutputList,
} from '../components'
import { findQueryVariableOption } from '../components/query-variable-utils'
import { countOperations, getListOperationValues } from './constants'
import { ListCountInput } from './count-input'
import { useListOperationsValues, usePersistListOperationsForm } from './hooks'
import {
  getListOperation,
  getListOperationLabelKey,
  getListOperationsVersion,
  getListStrictValue,
  isListOperationsVersionValid,
} from './utils'

const listOperationsSchema = z.object({
  query: z.string().optional(),
  operations: z.string().optional(),
  operations_version: z.unknown().optional(),
  n: z.unknown().optional(),
  strict: z.unknown().optional(),
  sort_method: z.string().optional(),
  filter: z
    .object({
      operator: z.string().optional(),
      value: z.string().optional(),
    })
    .optional(),
  outputs: z.record(z.string(), z.unknown()).optional(),
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

export const ListOperationsForm = memo(function ListOperationsForm({
  node,
}: INextOperatorForm) {
  const binding = useFormBinding()
  return (
    <ListOperationsFields
      key={JSON.stringify([binding?.nodeId ?? node?.id, binding?.path])}
      node={node}
    />
  )
})

const ListOperationsFields = memo(function ListOperationsFields({
  node,
}: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useListOperationsValues(node)
  const version = getListOperationsVersion(values)
  const legacy = version === ListOperationsVersion.Legacy
  const validVersion = isListOperationsVersionValid(version)
  const optionGroups = useBuildPromptVariableOptions(node?.id)

  const form = useForm<z.infer<typeof listOperationsSchema>>({
    resolver: zodResolver(listOperationsSchema),
    defaultValues: values,
  })

  const watchedOperation = useWatch({
    control: form.control,
    name: 'operations',
  })
  const operation = getListOperation({
    operations: watchedOperation,
    operations_version: version,
  })
  const listOperationOptions = getListOperationValues(legacy).map((value) => ({
    value,
    label: t(
      getListOperationLabelKey({
        operations: value,
        operations_version: version,
      }),
    ),
  }))
  const query = useWatch({
    control: form.control,
    name: 'query',
  })

  const selectedOption = useMemo(
    () => findQueryVariableOption(optionGroups, query),
    [optionGroups, query],
  )
  const itemType = useMemo(
    () =>
      getArrayElementType(
        (selectedOption as { type?: string } | undefined)?.type,
      ),
    [selectedOption],
  )
  const outputs = useMemo(() => buildListOutputs(itemType), [itemType])

  useEffect(() => {
    if (!validVersion) return
    form.setValue('outputs', outputs, { shouldDirty: true })

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
  }, [form, operation, outputs, validVersion])

  usePersistListOperationsForm(node?.id, form, validVersion)

  if (!validVersion) {
    return (
      <p role="alert" className="p-space-base text-status-error">
        {t('flow.listOperationsConfig.invalidVersion')}
      </p>
    )
  }

  return (
    <Form {...form}>
      <FormWrapper>
        {legacy && (
          <p className="text-text-secondary">
            {t('flow.listOperationsConfig.legacyTip')}
          </p>
        )}
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
                  value={operation}
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
                <FormLabel>{t('flow.listOperationsConfig.count')}</FormLabel>
                <FormControl>
                  <ListCountInput
                    ref={field.ref}
                    name={field.name}
                    onBlur={field.onBlur}
                    value={field.value}
                    onValueChange={field.onChange}
                    onValidityChange={(valid) =>
                      valid
                        ? form.clearErrors('n')
                        : form.setError('n', {
                            type: 'validate',
                            message: t(
                              'flow.listOperationsConfig.integerRequired',
                            ),
                          })
                    }
                  />
                </FormControl>
                <FormDescription>
                  {t(
                    legacy
                      ? 'flow.listOperationsConfig.legacyCountTip'
                      : operation === ListOperations.Nth
                        ? 'flow.listOperationsConfig.nthTip'
                        : 'flow.listOperationsConfig.sliceTip',
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {countOperations.has(operation) && !legacy && (
          <FormField
            control={form.control}
            name="strict"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('flow.strictMode')}</FormLabel>
                <FormControl>
                  <Switch
                    checked={getListStrictValue(field.value)}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>{t('flow.strictModeTip')}</FormDescription>
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
                      label: t(`flow.SortMethodOptions.${value}`),
                      value,
                    }))}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {operation === ListOperations.Filter && (
          <div className="gap-space-md grid grid-cols-1 md:grid-cols-[0.8fr_1fr]">
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
