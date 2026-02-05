import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { memo, useCallback } from 'react'
import { useFieldArray, useForm, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import {
  SwitchLogicOperatorOptions,
  SwitchOperatorOptions,
  initialSwitchValues,
} from '../constant'
import type { INextOperatorForm } from '../types'
import { FormWrapper } from './components'
import { QueryVariable } from './components/query-variable'
import { useFormValues } from '../hooks/use-form-values'
import { useWatchFormChange } from '../hooks/use-watch-form-change'

const ConditionKey = 'conditions'
const ItemKey = 'items'

const schema = z.object({
  conditions: z
    .array(
      z.object({
        logical_operator: z.string().optional(),
        items: z
          .array(
            z.object({
              cpn_id: z.string().optional(),
              operator: z.string().optional(),
              value: z.string().optional(),
            }),
          )
          .optional(),
        to: z.array(z.string()).optional(),
      }),
    )
    .optional(),
  end_cpn_ids: z.array(z.string()).optional(),
})

type ConditionCardsProps = {
  name: string
  removeParent(index: number): void
  parentIndex: number
  parentLength: number
}

function ConditionCards({
  name: parentName,
  parentIndex,
  removeParent,
  parentLength,
}: ConditionCardsProps) {
  const form = useFormContext()
  const { t } = useTranslation()

  const name = `${parentName}.${ItemKey}`
  const { fields, remove, append } = useFieldArray({
    name,
    control: form.control,
  })

  const handleRemove = useCallback(
    (index: number) => () => {
      remove(index)
      if (parentIndex !== 0 && index === 0 && parentLength === 1) {
        removeParent(parentIndex)
      }
    },
    [parentIndex, parentLength, remove, removeParent],
  )

  return (
    <section className="flex-1 min-w-0 flex flex-col gap-space-sm">
      {fields.map((field, index) => (
        <div key={field.id} className="flex">
          <Card
            className={cn(
              'relative bg-surface-primary border border-border-default flex-1 min-w-0 rounded-radius-md shadow-elevation-low',
              {
                'before:w-10 before:absolute before:h-px before:bg-border-default before:top-1/2 before:-left-10':
                  fields.length > 1 &&
                  (index === 0 || index === fields.length - 1),
              },
            )}
          >
            <section className="p-space-sm bg-surface-secondary flex items-center justify-between rounded-t-radius-md">
              <FormField
                control={form.control}
                name={`${name}.${index}.cpn_id`}
                render={({ field }) => (
                  <FormItem className="flex-1 min-w-0">
                    <FormControl>
                      <QueryVariable
                        name={field.name}
                        hideLabel
                        onChange={field.onChange}
                        triggerClassName="h-9 rounded-radius-md bg-surface-primary border border-border-default px-space-sm py-space-xs text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center">
                <Separator orientation="vertical" className="h-3" />
                <FormField
                  control={form.control}
                  name={`${name}.${index}.operator`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-28 h-9 rounded-radius-md bg-surface-primary border border-border-default px-space-sm py-space-xs text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SwitchOperatorOptions.map((op) => (
                              <SelectItem key={op.value} value={op.value}>
                                {t(
                                  `flow.switchOperatorOptions.${op.label}`,
                                  op.label,
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>
            <CardContent className="p-space-md">
              <FormField
                control={form.control}
                name={`${name}.${index}.value`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="bg-surface-primary border border-border-default rounded-radius-md min-h-24"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          <Button
            variant="ghost"
            size="icon"
            className="text-text-secondary hover:text-text-primary"
            onClick={handleRemove(index)}
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <div className="pr-space-lg">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-space-md"
          onClick={() => append({ operator: SwitchOperatorOptions[0]?.value })}
        >
          {t('common.add')}
        </Button>
      </div>
    </section>
  )
}

export function SwitchForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialSwitchValues, node)

  const form = useForm({
    defaultValues: values,
    resolver: zodResolver(schema),
  })

  const { fields, remove, append } = useFieldArray({
    name: ConditionKey,
    control: form.control,
  })

  useWatchFormChange(node?.id, form)

  return (
    <Form {...form}>
      <FormWrapper>
        {fields.map((field, index) => {
          const name = `${ConditionKey}.${index}`
          const conditions: Array<any> = form.getValues(`${name}.${ItemKey}`)
          const conditionLength = conditions?.length ?? 0
          return (
            <div
              key={field.id}
              className="rounded-radius-md border border-border-default p-space-sm bg-surface-primary shadow-elevation-low"
            >
              <div className="flex justify-between items-center">
                <section>
                  <span>{index === 0 ? 'IF' : 'ELSEIF'}</span>
                  <div className="text-text-secondary">Case {index + 1}</div>
                </section>
                {index !== 0 && (
                  <Button
                    variant="secondary"
                    onClick={() => remove(index)}
                  >
                    {t('common.remove')} <X className="ml-space-xs size-4" />
                  </Button>
                )}
              </div>
              <section className="flex gap-space-sm mt-space-sm relative">
                {conditionLength > 1 && (
                  <section className="flex flex-col w-[72px]">
                    <div className="relative w-1 flex-1 before:absolute before:w-px before:bg-border-default before:top-20 before:bottom-0 before:left-10" />
                    <FormField
                      control={form.control}
                      name={`${ConditionKey}.${index}.logical_operator`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="h-9 rounded-radius-md bg-surface-primary border border-border-default px-space-sm py-space-xs text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SwitchLogicOperatorOptions.map((op) => (
                                  <SelectItem key={op} value={op}>
                                    {t(
                                      `flow.switchLogicOperatorOptions.${op}`,
                                      op.toUpperCase(),
                                    )}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="relative w-1 flex-1 before:absolute before:w-px before:bg-border-default before:top-0 before:bottom-36 before:left-10" />
                  </section>
                )}
                <ConditionCards
                  name={name}
                  removeParent={remove}
                  parentIndex={index}
                  parentLength={fields.length}
                />
              </section>
            </div>
          )
        })}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() =>
            append({
              logical_operator: SwitchLogicOperatorOptions[0],
              [ItemKey]: [
                {
                  operator: SwitchOperatorOptions[0]?.value,
                },
              ],
              to: [],
            })
          }
        >
          {t('common.add')}
        </Button>
      </FormWrapper>
    </Form>
  )
}

export default memo(SwitchForm)
