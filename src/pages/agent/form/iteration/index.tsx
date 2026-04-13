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
import { useEffect, useMemo, useRef } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { ArrayFields, initialIterationValues } from '../../constant'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import useGraphStore from '../../store'
import type { INextOperatorForm } from '../../types'
import { FormWrapper, Output, QueryVariable, buildOutputList } from '../components'
import {
  buildIterationChildOutputGroups,
  buildIterationOutputs,
  buildSuggestedIterationOutputItems,
  type IterationOutputItem,
  normalizeIterationOutputItems,
} from './utils'

const iterationSchema = z.object({
  items_ref: z.string().optional(),
  output_items: z
    .array(
      z.object({
        name: z.string().optional(),
        ref: z.string().optional(),
        type: z.string().optional(),
      }),
    )
    .optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

type IterationFormValues = z.input<typeof iterationSchema>

export function IterationForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const nodes = useGraphStore((state) => state.nodes)
  const seededRef = useRef(false)
  const baseValues = useFormValues(initialIterationValues, node)
  const defaultValues = useMemo(() => {
    const normalizedOutputItems = normalizeIterationOutputItems(
      (baseValues as Record<string, unknown>).output_items ||
        (baseValues as Record<string, unknown>).outputs,
    )

    return {
      ...baseValues,
      output_items: normalizedOutputItems,
      outputs: buildIterationOutputs(normalizedOutputItems),
    }
  }, [baseValues])

  const form = useForm<
    IterationFormValues,
    unknown,
    z.output<typeof iterationSchema>
  >({
    resolver: zodResolver(iterationSchema),
    defaultValues: defaultValues as IterationFormValues,
  })

  const outputFieldArray = useFieldArray({
    control: form.control,
    name: 'output_items',
  })

  const rawOutputItems = useWatch({
    control: form.control,
    name: 'output_items',
  })

  const outputItems = useMemo<IterationOutputItem[]>(() => {
    return normalizeIterationOutputItems(rawOutputItems)
  }, [rawOutputItems])

  const childOutputGroups = useMemo(() => {
    return buildIterationChildOutputGroups(nodes, node?.id)
  }, [node?.id, nodes])

  useEffect(() => {
    if (!seededRef.current && outputItems.length === 0 && childOutputGroups.length > 0) {
      seededRef.current = true
      form.setValue(
        'output_items',
        buildSuggestedIterationOutputItems(childOutputGroups),
        { shouldDirty: true },
      )
    }
  }, [childOutputGroups, form, outputItems])

  useEffect(() => {
    form.setValue('outputs', buildIterationOutputs(outputItems), {
      shouldDirty: true,
    })
  }, [form, outputItems])

  useWatchFormChange(node?.id, form)

  const outputs = useMemo(() => {
    return buildOutputList(buildIterationOutputs(outputItems))
  }, [outputItems])

  return (
    <Form {...form}>
      <FormWrapper>
        <QueryVariable
          name="items_ref"
          label={t('flow.iterationItems', 'Items Reference')}
          types={ArrayFields as unknown as string[]}
          nodeId={node?.id}
        />

        <section className="space-y-space-md rounded-radius-md border border-border-default p-space-base">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-text-primary">
              {t('flow.output', 'Output')}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                outputFieldArray.append({
                  name: '',
                  ref: '',
                  type: 'Array<unknown>',
                })
              }
            >
              <Plus className="mr-space-xs size-4" />
              {t('common.add', 'Add')}
            </Button>
          </div>

          {outputFieldArray.fields.map((field, index) => (
            <div key={field.id} className="space-y-space-sm">
              <div className="grid gap-space-sm md:grid-cols-[0.8fr_auto_1.2fr_auto] md:items-end">
                <FormField
                  control={form.control}
                  name={`output_items.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          placeholder={t('flow.outputName', 'Output name')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator orientation="vertical" className="hidden h-10 md:block" />

                <QueryVariable
                  name={`output_items.${index}.ref`}
                  hideLabel
                  optionGroups={childOutputGroups}
                  onChange={(value) => {
                    const selectedGroup = childOutputGroups.find((group) =>
                      group.options.some((option) => option.value === value),
                    )
                    const selectedOption = selectedGroup?.options.find(
                      (option) => option.value === value,
                    )

                    form.setValue(
                      `output_items.${index}.type`,
                      `Array<${(selectedOption as { type?: string } | undefined)?.type || 'unknown'}>`,
                      { shouldDirty: true },
                    )

                    if (!form.getValues(`output_items.${index}.name`)) {
                      form.setValue(
                        `output_items.${index}.name`,
                        String(selectedOption?.label || ''),
                        { shouldDirty: true },
                      )
                    }
                  }}
                />

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => outputFieldArray.remove(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </section>

        <Output list={outputs} />
      </FormWrapper>
    </Form>
  )
}
