import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SelectWithSearch } from '@/components/ui/select-with-search'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { memo, useMemo } from 'react'
import { useForm, useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import {
  JsonSchemaDataType,
  VariableAssignerLogicalArrayOperator,
  VariableAssignerLogicalNumberOperator,
  VariableAssignerLogicalOperator,
  initialVariableAssignerValues,
} from '../../constant'
import { useBuildPromptVariableOptions } from '../../hooks/use-get-begin-query'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import {
  CompactRecordList,
  CompactRecordRow,
  FormWrapper,
  QueryVariable,
  RecordAdvancedPanel,
} from '../components'
import { findQueryVariableOption } from '../components/query-variable-utils'
import { getVariableAssignerOperatorLabel } from './utils'

const variableAssignerSchema = z.object({
  variables: z
    .array(
      z.object({
        variable: z.string().optional(),
        operator: z.string().optional(),
        parameter: z.union([z.string(), z.number(), z.boolean()]).optional(),
      }),
    )
    .optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

function getArrayElementType(type?: string) {
  if (!type) {
    return 'unknown'
  }

  const match = type.trim().match(/^array<(.+)>$/i)
  if (match?.[1]) {
    return match[1]
  }

  return 'unknown'
}

function buildOperatorOptions(
  t: ReturnType<typeof useTranslation>['t'],
  type?: string,
) {
  const normalized = (type || '').toLowerCase()

  if (normalized.startsWith('array')) {
    return [
      VariableAssignerLogicalOperator.Overwrite,
      VariableAssignerLogicalOperator.Clear,
      VariableAssignerLogicalArrayOperator.Append,
      VariableAssignerLogicalArrayOperator.Extend,
      VariableAssignerLogicalArrayOperator.RemoveFirst,
      VariableAssignerLogicalArrayOperator.RemoveLast,
    ].map((value) => ({
      label: getVariableAssignerOperatorLabel(t, value),
      value,
    }))
  }

  if (normalized === JsonSchemaDataType.Number) {
    return [
      VariableAssignerLogicalNumberOperator.Overwrite,
      VariableAssignerLogicalNumberOperator.Clear,
      VariableAssignerLogicalNumberOperator.Set,
      VariableAssignerLogicalNumberOperator.Add,
      VariableAssignerLogicalNumberOperator.Subtract,
      VariableAssignerLogicalNumberOperator.Multiply,
      VariableAssignerLogicalNumberOperator.Divide,
    ].map((value) => ({
      label: getVariableAssignerOperatorLabel(t, value),
      value,
    }))
  }

  return [
    VariableAssignerLogicalOperator.Overwrite,
    VariableAssignerLogicalOperator.Clear,
    VariableAssignerLogicalOperator.Set,
  ].map((value) => ({
    label: getVariableAssignerOperatorLabel(t, value),
    value,
  }))
}

function needsParameter(operator?: string) {
  return !(
    [
      VariableAssignerLogicalOperator.Clear,
      VariableAssignerLogicalArrayOperator.RemoveFirst,
      VariableAssignerLogicalArrayOperator.RemoveLast,
    ] as string[]
  ).includes(operator || '')
}

function VariableParameterField({
  index,
  type,
}: {
  index: number
  type?: string
}) {
  const { t } = useTranslation()
  const form = useFormContext()
  const operator = useWatch({
    control: form.control,
    name: `variables.${index}.operator`,
  })

  if (!needsParameter(operator)) {
    return null
  }

  if (
    operator === VariableAssignerLogicalOperator.Overwrite ||
    operator === VariableAssignerLogicalArrayOperator.Extend
  ) {
    return (
      <QueryVariable
        name={`variables.${index}.parameter`}
        label={t('flow.parameter', 'Parameter')}
        types={type ? [type] : []}
      />
    )
  }

  if (operator === VariableAssignerLogicalArrayOperator.Append) {
    const elementType = getArrayElementType(type)

    return (
      <QueryVariable
        name={`variables.${index}.parameter`}
        label={t('flow.parameter', 'Parameter')}
        types={elementType ? [elementType] : []}
      />
    )
  }

  if (type === JsonSchemaDataType.Boolean) {
    return (
      <FormField
        control={form.control}
        name={`variables.${index}.parameter`}
        render={({ field }) => (
          <FormItem className="flex items-center justify-between">
            <FormLabel>{t('flow.parameter', 'Parameter')}</FormLabel>
            <FormControl>
              <Switch
                checked={Boolean(field.value)}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
    )
  }

  if (type === JsonSchemaDataType.Number || operator?.includes('=')) {
    return (
      <FormField
        control={form.control}
        name={`variables.${index}.parameter`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.parameter', 'Parameter')}</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...field}
                value={field.value ?? 0}
                onChange={(event) => field.onChange(Number(event.target.value))}
              />
            </FormControl>
          </FormItem>
        )}
      />
    )
  }

  if (type === JsonSchemaDataType.Object) {
    return (
      <FormField
        control={form.control}
        name={`variables.${index}.parameter`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.parameter', 'Parameter')}</FormLabel>
            <FormControl>
              <Textarea rows={4} {...field} value={field.value ?? ''} />
            </FormControl>
          </FormItem>
        )}
      />
    )
  }

  return (
    <FormField
      control={form.control}
      name={`variables.${index}.parameter`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('flow.parameter', 'Parameter')}</FormLabel>
          <FormControl>
            <Textarea rows={3} {...field} value={field.value ?? ''} />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

export const VariableAssignerForm = memo(function VariableAssignerForm({
  node,
}: INextOperatorForm) {
  const { t } = useTranslation()
  const variableOptions = useBuildPromptVariableOptions()
  const values = useFormValues(initialVariableAssignerValues, node)

  const form = useForm({
    resolver: zodResolver(variableAssignerSchema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const watchedVariables = useWatch({
    control: form.control,
    name: 'variables',
  })
  const variables = useMemo(
    () =>
      (watchedVariables || []) as Array<{
        variable?: string
        operator?: string
      }>,
    [watchedVariables],
  )

  const variableTypes = useMemo(
    () =>
      variables.map(
        (item) =>
          (
            findQueryVariableOption(variableOptions, item?.variable) as
              | {
                  type?: string
                }
              | undefined
          )?.type,
      ),
    [variableOptions, variables],
  )

  return (
    <Form {...form}>
      <FormWrapper>
        <CompactRecordList
          name="variables"
          label={t('flow.variables', 'Variables')}
          addLabel={t('common.add', 'Add')}
          emptyLabel={t('flow.noVariables', 'No variables yet')}
          defaultValue={{
            variable: '',
            operator: VariableAssignerLogicalOperator.Overwrite,
            parameter: '',
          }}
        >
          {({ field, index, ctx }) => {
            const type = variableTypes[index]

            return (
              <CompactRecordRow
                key={field.id}
                onRemove={() => ctx.remove(index)}
                chip={type || undefined}
                advanced={
                  <RecordAdvancedPanel>
                    <VariableParameterField index={index} type={type} />
                  </RecordAdvancedPanel>
                }
              >
                <QueryVariable
                  name={`variables.${index}.variable`}
                  hideLabel
                  className="min-w-0 flex-[2_1_0]"
                />

                <FormField
                  control={form.control}
                  name={`variables.${index}.operator`}
                  render={({ field: operatorField }) => (
                    <FormItem className="min-w-0 flex-[1_1_0]">
                      <FormControl>
                        <SelectWithSearch
                          value={
                            operatorField.value ||
                            VariableAssignerLogicalOperator.Overwrite
                          }
                          onChange={operatorField.onChange}
                          options={buildOperatorOptions(t, type)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CompactRecordRow>
            )
          }}
        </CompactRecordList>
      </FormWrapper>
    </Form>
  )
})
