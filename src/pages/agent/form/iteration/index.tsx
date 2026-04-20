import { Form } from '@/components/ui/form'
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { ArrayFields, initialIterationValues } from '../../constant'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import useGraphStore from '../../store'
import type { INextOperatorForm } from '../../types'
import {
  CompactRecordList,
  CompactRecordRow,
  FormWrapper,
  Output,
  QueryVariable,
  buildOutputList,
} from '../components'
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
    if (
      !seededRef.current &&
      outputItems.length === 0 &&
      childOutputGroups.length > 0
    ) {
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

  const outputs = useMemo(
    () => buildOutputList(buildIterationOutputs(outputItems)),
    [outputItems],
  )

  return (
    <Form {...form}>
      <FormWrapper>
        <QueryVariable
          name="items_ref"
          label={t('flow.iterationItems', '查找变量')}
          types={ArrayFields as unknown as string[]}
          nodeId={node?.id}
        />

        <CompactRecordList
          name="output_items"
          label={t('flow.output', '输出')}
          addLabel={t('common.add', '添加')}
          emptyLabel={t(
            'flow.iterationOutputsEmpty',
            '还没有输出项，添加子节点后再从这里引用它们的变量',
          )}
          defaultValue={{ name: '', ref: '', type: 'Array<unknown>' }}
        >
          {({ field, index, ctx }) => (
            <CompactRecordRow
              key={field.id}
              onRemove={() => ctx.remove(index)}
            >
              <FormField
                control={form.control}
                name={`output_items.${index}.name`}
                render={({ field: inputField }) => (
                  <FormItem className="flex-[0_0_9rem]">
                    <FormControl>
                      <Input
                        {...inputField}
                        value={inputField.value ?? ''}
                        placeholder={t('flow.outputName', '输出名称')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <QueryVariable
                name={`output_items.${index}.ref`}
                hideLabel
                className="flex-1 min-w-0"
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
                    `Array<${
                      (selectedOption as { type?: string } | undefined)?.type ||
                      'unknown'
                    }>`,
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
            </CompactRecordRow>
          )}
        </CompactRecordList>

        <Output list={outputs} />
      </FormWrapper>
    </Form>
  )
}
