import { SliderInputFormField } from '@/components/forms/SliderInputFormField'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SelectWithSearch } from '@/components/ui/select-with-search'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { memo, useEffect, useMemo } from 'react'
import { useForm, useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import {
  ComparisonOperator,
  InputMode,
  LoopTerminationComparisonOperator,
  TypesWithArray,
  initialLoopValues,
} from '../../constant'
import { useBuildPromptVariableOptions } from '../../hooks/use-get-begin-query'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import {
  CompactRecordList,
  CompactRecordRow,
  FormWrapper,
  Output,
  QueryVariable,
  RecordAdvancedPanel,
  buildOutputList,
} from '../components'

const loopSchema = z.object({
  loop_variables: z
    .array(
      z.object({
        variable: z.string().optional(),
        type: z.string().optional(),
        value: z.union([z.string(), z.number(), z.boolean()]).optional(),
        input_mode: z.string().optional(),
      }),
    )
    .optional(),
  loop_termination_condition: z
    .array(
      z.object({
        variable: z.string().optional(),
        operator: z.string().optional(),
        value: z.union([z.string(), z.number(), z.boolean()]).optional(),
        input_mode: z.string().optional(),
      }),
    )
    .optional(),
  maximum_loop_count: z.coerce.number().optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

function buildTypeOptions(values: string[]) {
  return values.map((value) => ({ label: value, value }))
}

function buildLoopOutputs(
  variables: Array<{ variable?: string; type?: string }> = [],
) {
  return variables.reduce<Record<string, { type?: string }>>((result, item) => {
    const key = item.variable?.trim()

    if (!key) {
      return result
    }

    result[key] = {
      type: item.type,
    }

    return result
  }, {})
}

function buildConditionOperatorOptions(type?: string) {
  const normalized = (type || '').toLowerCase()

  if (normalized.includes('boolean')) {
    return [
      LoopTerminationComparisonOperator.Is,
      LoopTerminationComparisonOperator.IsNot,
    ].map((value) => ({ label: value, value }))
  }

  if (normalized.includes('number')) {
    return [
      ComparisonOperator.Equal,
      ComparisonOperator.NotEqual,
      ComparisonOperator.GreatThan,
      ComparisonOperator.GreatEqual,
      ComparisonOperator.LessThan,
      ComparisonOperator.LessEqual,
    ].map((value) => ({ label: value, value }))
  }

  return [
    LoopTerminationComparisonOperator.Contains,
    LoopTerminationComparisonOperator.NotContains,
    LoopTerminationComparisonOperator.StartWith,
    LoopTerminationComparisonOperator.EndWith,
    LoopTerminationComparisonOperator.Is,
    LoopTerminationComparisonOperator.IsNot,
  ].map((value) => ({ label: value, value }))
}

function LoopVariableValueField({
  index,
  type,
}: {
  index: number
  type?: string
}) {
  const { t } = useTranslation()
  const form = useFormContext()
  const inputMode = useWatch({
    control: form.control,
    name: `loop_variables.${index}.input_mode`,
  })

  if (inputMode === InputMode.Variable) {
    return (
      <QueryVariable
        name={`loop_variables.${index}.value`}
        label={t('flow.value', 'Value')}
        types={type ? [type] : []}
      />
    )
  }

  if (type === TypesWithArray.Boolean) {
    return (
      <FormField
        control={form.control}
        name={`loop_variables.${index}.value`}
        render={({ field }) => (
          <FormItem className="flex items-center justify-between">
            <FormLabel>{t('flow.value', 'Value')}</FormLabel>
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

  if (type === TypesWithArray.Number) {
    return (
      <FormField
        control={form.control}
        name={`loop_variables.${index}.value`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.value', 'Value')}</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...field}
                value={field.value ?? 0}
                onChange={(event) =>
                  field.onChange(Number(event.target.value))
                }
              />
            </FormControl>
          </FormItem>
        )}
      />
    )
  }

  if ((type || '').toLowerCase().startsWith('array') || type === TypesWithArray.Object) {
    return (
      <FormField
        control={form.control}
        name={`loop_variables.${index}.value`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.value', 'Value')}</FormLabel>
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
      name={`loop_variables.${index}.value`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('flow.value', 'Value')}</FormLabel>
          <FormControl>
            <Textarea rows={3} {...field} value={field.value ?? ''} />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

function LoopConditionValueField({
  index,
  type,
  optionGroups,
}: {
  index: number
  type?: string
  optionGroups: ReturnType<typeof useBuildPromptVariableOptions>
}) {
  const { t } = useTranslation()
  const form = useFormContext()
  const inputMode = useWatch({
    control: form.control,
    name: `loop_termination_condition.${index}.input_mode`,
  })
  const operator = useWatch({
    control: form.control,
    name: `loop_termination_condition.${index}.operator`,
  })

  if (
    [ComparisonOperator.Empty, ComparisonOperator.NotEmpty].includes(operator)
  ) {
    return null
  }

  if (inputMode === InputMode.Variable) {
    return (
      <QueryVariable
        name={`loop_termination_condition.${index}.value`}
        label={t('flow.value', 'Value')}
        types={type ? [type] : []}
        optionGroups={optionGroups}
      />
    )
  }

  if ((type || '').toLowerCase().includes('boolean')) {
    return (
      <FormField
        control={form.control}
        name={`loop_termination_condition.${index}.value`}
        render={({ field }) => (
          <FormItem className="flex items-center justify-between">
            <FormLabel>{t('flow.value', 'Value')}</FormLabel>
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

  return (
    <FormField
      control={form.control}
      name={`loop_termination_condition.${index}.value`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('flow.value', 'Value')}</FormLabel>
          <FormControl>
            <Input
              {...field}
              value={`${field.value ?? ''}`}
              type={(type || '').toLowerCase().includes('number') ? 'number' : 'text'}
              onChange={(event) =>
                (type || '').toLowerCase().includes('number')
                  ? field.onChange(Number(event.target.value))
                  : field.onChange(event.target.value)
              }
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

export const LoopForm = memo(function LoopForm({
  node,
}: INextOperatorForm) {
  const { t } = useTranslation()
  const baseOptionGroups = useBuildPromptVariableOptions()
  const values = useFormValues(initialLoopValues, node)

  const form = useForm({
    resolver: zodResolver(loopSchema),
    defaultValues: values,
  })

  const watchedLoopVariables = useWatch({
    control: form.control,
    name: 'loop_variables',
  })
  const loopVariables = useMemo(
    () =>
      (watchedLoopVariables || []) as Array<{
        variable?: string
        type?: string
        input_mode?: string
      }>,
    [watchedLoopVariables],
  )
  const conditions =
    (useWatch({
      control: form.control,
      name: 'loop_termination_condition',
    }) || []) as Array<{
      variable?: string
      operator?: string
    }>

  const currentLoopOptionGroup = useMemo(
    () => [
      {
        label: t('flow.loopVariables', 'Loop variables'),
        title: t('flow.loopVariables', 'Loop variables'),
        options: loopVariables
          .filter((item) => item.variable)
          .map((item) => ({
            label: item.variable || '',
            value: `${node?.id}@${item.variable}`,
            type: item.type,
          })),
      },
    ],
    [loopVariables, node?.id, t],
  )

  const conditionOptionGroups = useMemo(
    () => [...currentLoopOptionGroup, ...baseOptionGroups],
    [baseOptionGroups, currentLoopOptionGroup],
  )

  const outputs = useMemo(() => buildLoopOutputs(loopVariables), [loopVariables])

  useEffect(() => {
    form.setValue('outputs', outputs, { shouldDirty: true })
  }, [form, outputs])

  useWatchFormChange(node?.id, form)

  return (
    <Form {...form}>
      <FormWrapper>
        <CompactRecordList
          name="loop_variables"
          label={t('flow.loopVariables', 'Loop variables')}
          addLabel={t('common.add', 'Add')}
          emptyLabel={t('flow.noVariables', 'No variables yet')}
          defaultValue={{
            variable: '',
            type: TypesWithArray.String,
            value: '',
            input_mode: InputMode.Constant,
          }}
        >
          {({ field, index, ctx }) => {
            const type = loopVariables[index]?.type || TypesWithArray.String

            return (
              <CompactRecordRow
                key={field.id}
                onRemove={() => ctx.remove(index)}
                chip={type}
                advanced={
                  <RecordAdvancedPanel>
                    <LoopVariableValueField index={index} type={type} />
                  </RecordAdvancedPanel>
                }
              >
                <FormField
                  control={form.control}
                  name={`loop_variables.${index}.variable`}
                  render={({ field: variableField }) => (
                    <FormItem className="flex-[1.2_1_0] min-w-0">
                      <FormControl>
                        <Input
                          {...variableField}
                          value={variableField.value ?? ''}
                          placeholder={t('flow.variable', 'Variable')}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`loop_variables.${index}.type`}
                  render={({ field: typeField }) => (
                    <FormItem className="flex-[1_1_0] min-w-0">
                      <FormControl>
                        <SelectWithSearch
                          value={typeField.value || TypesWithArray.String}
                          onChange={typeField.onChange}
                          options={buildTypeOptions(Object.values(TypesWithArray))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`loop_variables.${index}.input_mode`}
                  render={({ field: inputModeField }) => (
                    <FormItem className="flex-[0.9_1_0] min-w-0">
                      <FormControl>
                        <SelectWithSearch
                          value={inputModeField.value || InputMode.Constant}
                          onChange={inputModeField.onChange}
                          options={buildTypeOptions(Object.values(InputMode))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CompactRecordRow>
            )
          }}
        </CompactRecordList>

        <CompactRecordList
          name="loop_termination_condition"
          label={t('flow.loopTerminationCondition', 'Loop termination condition')}
          addLabel={t('common.add', 'Add')}
          emptyLabel={t('common.noData', 'No items yet')}
          defaultValue={{
            variable: '',
            operator: ComparisonOperator.Equal,
            value: '',
            input_mode: InputMode.Constant,
          }}
        >
          {({ field, index, ctx }) => {
            const variableValue = conditions[index]?.variable
            const selectedLoopVariable = currentLoopOptionGroup[0]?.options.find(
              (item) => item.value === variableValue,
            )
            const selectedBaseOption = baseOptionGroups
              .flatMap((group) => group.options)
              .find((item) => item.value === variableValue)
            const type =
              selectedLoopVariable?.type || selectedBaseOption?.type || 'string'

            return (
              <CompactRecordRow
                key={field.id}
                onRemove={() => ctx.remove(index)}
                chip={type}
                advanced={
                  <RecordAdvancedPanel>
                    <LoopConditionValueField
                      index={index}
                      type={type}
                      optionGroups={conditionOptionGroups}
                    />
                  </RecordAdvancedPanel>
                }
              >
                <QueryVariable
                  name={`loop_termination_condition.${index}.variable`}
                  hideLabel
                  className="flex-[1.4_1_0] min-w-0"
                  optionGroups={conditionOptionGroups}
                />
                <FormField
                  control={form.control}
                  name={`loop_termination_condition.${index}.operator`}
                  render={({ field: operatorField }) => (
                    <FormItem className="flex-[1_1_0] min-w-0">
                      <FormControl>
                        <SelectWithSearch
                          value={
                            operatorField.value || ComparisonOperator.Equal
                          }
                          onChange={operatorField.onChange}
                          options={buildConditionOperatorOptions(type)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`loop_termination_condition.${index}.input_mode`}
                  render={({ field: inputModeField }) => (
                    <FormItem className="flex-[0.9_1_0] min-w-0">
                      <FormControl>
                        <SelectWithSearch
                          value={inputModeField.value || InputMode.Constant}
                          onChange={inputModeField.onChange}
                          options={buildTypeOptions(Object.values(InputMode))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CompactRecordRow>
            )
          }}
        </CompactRecordList>

        <SliderInputFormField
          name="maximum_loop_count"
          label={t('flow.maximumLoopCount', 'Maximum loop count')}
          min={1}
          max={100}
          step={1}
          defaultValue={10}
          layout="vertical"
        />

        <Output list={buildOutputList(outputs)} />
      </FormWrapper>
    </Form>
  )
})
