import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { type Control, useFieldArray, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { initialHierarchicalMergerValues } from '../../constant'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import { FormWrapper, Output, buildOutputList } from '../components'
import { normalizeHierarchicalMergerFormForStore } from './utils'

const hierarchicalMergerSchema = z.object({
  hierarchy: z.string().optional(),
  levels: z
    .array(
      z.object({
        expressions: z
          .array(
            z.object({
              expression: z.string().optional(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

const hierarchyOptions = ['1', '2', '3', '4', '5']

type HierarchicalMergerFormValues = z.input<typeof hierarchicalMergerSchema>

type LevelCardProps = {
  levelIndex: number
  control: Control<HierarchicalMergerFormValues>
  onRemove: (index: number) => void
}

function LevelCard({ levelIndex, control, onRemove }: LevelCardProps) {
  const { t } = useTranslation()
  const expressionsFieldArray = useFieldArray({
    control,
    name: `levels.${levelIndex}.expressions`,
  })

  return (
    <Card padding="sm">
      <CardHeader className="flex-row items-center justify-between p-space-sm">
        <span className="text-sm font-medium text-text-primary">
          H{levelIndex + 1}
        </span>
        <Button type="button" variant="ghost" onClick={() => onRemove(levelIndex)}>
          <Trash2 className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-space-sm p-space-sm pt-0">
        {expressionsFieldArray.fields.map((expressionField, expressionIndex) => (
          <div key={expressionField.id} className="flex items-start gap-space-sm">
            <FormField
              control={control}
              name={`levels.${levelIndex}.expressions.${expressionIndex}.expression`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className={expressionIndex > 0 ? 'sr-only' : ''}>
                    {t('flow.regularExpression', 'Regular Expression')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder="^##[^#]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="button"
              variant="ghost"
              onClick={() => expressionsFieldArray.remove(expressionIndex)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => expressionsFieldArray.append({ expression: '' })}
        >
          <Plus className="mr-space-xs size-4" />
          {t('flow.addExpression', 'Add Expression')}
        </Button>
      </CardContent>
    </Card>
  )
}

export function HierarchicalMergerForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = normalizeHierarchicalMergerFormForStore(
    useFormValues(initialHierarchicalMergerValues, node),
  )

  const form = useForm<
    HierarchicalMergerFormValues,
    unknown,
    z.output<typeof hierarchicalMergerSchema>
  >({
    resolver: zodResolver(hierarchicalMergerSchema),
    defaultValues: values as HierarchicalMergerFormValues,
    mode: 'onChange',
  })

  const levelsFieldArray = useFieldArray({
    control: form.control,
    name: 'levels',
  })

  useWatchFormChange(node?.id, form)

  const outputs = useMemo(() => buildOutputList(form.getValues('outputs')), [form])

  return (
    <Form {...form}>
      <FormWrapper>
        <FormField
          control={form.control}
          name="hierarchy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.hierarchy', 'Hierarchy')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {hierarchyOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        H{option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-space-md">
          {levelsFieldArray.fields.map((levelField, levelIndex) => (
            <LevelCard
              key={levelField.id}
              control={form.control}
              levelIndex={levelIndex}
              onRemove={levelsFieldArray.remove}
            />
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => levelsFieldArray.append({ expressions: [{ expression: '' }] })}
        >
          <Plus className="mr-space-xs size-4" />
          {t('common.add', 'Add')}
        </Button>

        <Output list={outputs} />
      </FormWrapper>
    </Form>
  )
}
