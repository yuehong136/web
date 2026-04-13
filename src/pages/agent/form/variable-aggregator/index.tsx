import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { memo, useEffect, useMemo } from 'react'
import {
  type Control,
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { initialVariableAggregatorValues } from '../../constant'
import { useBuildNodeOutputOptions } from '../../hooks/use-build-options'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import { FormWrapper, Output, QueryVariable, buildOutputList } from '../components'
import {
  buildVariableAggregatorOutputs,
  normalizeVariableAggregatorGroups,
} from './utils'

const variableAggregatorSchema = z.object({
  groups: z
    .array(
      z.object({
        group_name: z.string().optional(),
        type: z.string().optional(),
        variables: z.array(z.object({ value: z.string().optional() })).optional(),
      }),
    )
    .optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

type VariableAggregatorFormValues = z.input<typeof variableAggregatorSchema>

type VariableAggregatorGroupSectionProps = {
  control: Control<VariableAggregatorFormValues>
  groupIndex: number
  nodeId?: string
  optionGroups: ReturnType<typeof useBuildNodeOutputOptions>
  onRemoveGroup: (index: number) => void
}

function VariableAggregatorGroupSection({
  control,
  groupIndex,
  nodeId,
  optionGroups,
  onRemoveGroup,
}: VariableAggregatorGroupSectionProps) {
  const { t } = useTranslation()
  const form = useFormContext<VariableAggregatorFormValues>()
  const variablesFieldArray = useFieldArray({
    control,
    name: `groups.${groupIndex}.variables`,
  })
  const currentGroupType = form.watch(`groups.${groupIndex}.type`)

  return (
    <div className="space-y-space-md rounded-radius-md border border-border-default p-space-base">
      <div className="flex items-center justify-between gap-space-sm">
        <div className="flex-1">
          <FormField
            control={control}
            name={`groups.${groupIndex}.group_name`}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    placeholder={t('flow.groupName', 'Group name')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {currentGroupType && (
          <span className="rounded-radius-sm border border-border-default px-space-sm py-space-xs text-xs text-text-secondary">
            {currentGroupType}
          </span>
        )}

        <Button
          type="button"
          variant="ghost"
          onClick={() => onRemoveGroup(groupIndex)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <Separator />

      <div className="space-y-space-sm">
        {variablesFieldArray.fields.map((variableField, variableIndex) => (
          <div key={variableField.id} className="flex items-start gap-space-sm">
            <QueryVariable
              name={`groups.${groupIndex}.variables.${variableIndex}.value`}
              hideLabel
              className="flex-1"
              nodeId={nodeId}
              types={currentGroupType ? [currentGroupType] : []}
              onChange={(value) => {
                const selectedGroup = optionGroups.find((group) =>
                  group.options.some((option) => option.value === value),
                )
                const selectedOption = selectedGroup?.options.find(
                  (option) => option.value === value,
                )

                if (variableIndex === 0) {
                  form.setValue(
                    `groups.${groupIndex}.type`,
                    (selectedOption as { type?: string } | undefined)?.type || 'unknown',
                    { shouldDirty: true },
                  )
                }
              }}
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => variablesFieldArray.remove(variableIndex)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => variablesFieldArray.append({ value: '' })}
      >
        <Plus className="mr-space-xs size-4" />
        {t('common.add', 'Add')}
      </Button>
    </div>
  )
}

export const VariableAggregatorForm = memo(function VariableAggregatorForm({
  node,
}: INextOperatorForm) {
  const { t } = useTranslation()
  const optionGroups = useBuildNodeOutputOptions(node?.id)
  const baseValues = useFormValues(initialVariableAggregatorValues, node)
  const defaultValues = useMemo(() => {
    const groups = normalizeVariableAggregatorGroups(
      (baseValues as Record<string, unknown>).groups,
    )

    return {
      ...baseValues,
      groups,
      outputs: buildVariableAggregatorOutputs(groups, optionGroups),
    }
  }, [baseValues, optionGroups])

  const form = useForm<
    VariableAggregatorFormValues,
    unknown,
    z.output<typeof variableAggregatorSchema>
  >({
    resolver: zodResolver(variableAggregatorSchema),
    defaultValues: defaultValues as VariableAggregatorFormValues,
    mode: 'onChange',
  })

  const groupsFieldArray = useFieldArray({
    control: form.control,
    name: 'groups',
  })

  const rawGroups = useWatch({
    control: form.control,
    name: 'groups',
  })

  const groups = useMemo(() => normalizeVariableAggregatorGroups(rawGroups), [rawGroups])

  useEffect(() => {
    form.setValue(
      'outputs',
      buildVariableAggregatorOutputs(
        normalizeVariableAggregatorGroups(groups),
        optionGroups,
      ),
      { shouldDirty: true },
    )
  }, [form, groups, optionGroups])

  useWatchFormChange(node?.id, form)

  const outputs = useMemo(() => {
    return buildOutputList(
      buildVariableAggregatorOutputs(
        normalizeVariableAggregatorGroups(groups),
        optionGroups,
      ),
    )
  }, [groups, optionGroups])

  return (
    <Form {...form}>
      <FormWrapper>
        <section className="space-y-space-md">
          {groupsFieldArray.fields.map((groupField, groupIndex) => (
            <VariableAggregatorGroupSection
              key={groupField.id}
              control={form.control}
              groupIndex={groupIndex}
              nodeId={node?.id}
              optionGroups={optionGroups}
              onRemoveGroup={groupsFieldArray.remove}
            />
          ))}
        </section>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() =>
            groupsFieldArray.append({
              group_name: `group_${groupsFieldArray.fields.length + 1}`,
              variables: [],
            })
          }
        >
          <Plus className="mr-space-xs size-4" />
          {t('flow.addGroup', 'Add Group')}
        </Button>

        <Output list={outputs} />
      </FormWrapper>
    </Form>
  )
})
