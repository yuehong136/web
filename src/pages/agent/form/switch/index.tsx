import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { zodResolver } from '@hookform/resolvers/zod'
import { memo } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Plus, X } from 'lucide-react'
import { z } from 'zod'
import {
  SwitchLogicOperatorOptions,
  SwitchOperatorOptions,
} from '../../constant'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import { FormWrapper } from '../components'
import { ConditionCards } from './components/condition-cards'
import type { SwitchFormValues } from './types'
import { useValues } from './use-values'

const conditionKey = 'conditions'
const itemKey = 'items'

const schema = z.object({
  conditions: z.array(
    z.object({
      logical_operator: z.string(),
      items: z
        .array(
          z.object({
            cpn_id: z.string(),
            operator: z.string(),
            value: z.string().optional(),
          }),
        )
        .optional(),
      to: z.array(z.string()).optional(),
    }),
  ),
  end_cpn_ids: z.array(z.string()).optional(),
})

export function SwitchForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useValues(node)

  const form = useForm<SwitchFormValues>({
    defaultValues: values,
    resolver: zodResolver(schema),
  })

  const { fields, remove, append } = useFieldArray({
    name: conditionKey,
    control: form.control,
  })

  useWatchFormChange(node?.id, form)

  return (
    <Form {...form}>
      <FormWrapper>
        {fields.map((field, index) => {
          const name = `${conditionKey}.${index}` as const
          const conditions = form.getValues('conditions')?.[index]?.items
          const conditionLength = conditions?.length ?? 0

          return (
            <section key={field.id} className="space-y-space-md">
              <div className="flex items-center justify-between">
                <section>
                  <span>{index === 0 ? 'IF' : 'ELSEIF'}</span>
                  <div className="text-text-secondary">Case {index + 1}</div>
                </section>
                {index !== 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-text-secondary hover:text-status-error"
                    onClick={() => remove(index)}
                    aria-label={t('common.remove')}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
              <section className="relative flex gap-space-sm">
                {conditionLength > 1 && (
                  <section className="flex w-[72px] shrink-0 flex-col items-center">
                    <div className="relative w-1 flex-1 before:absolute before:bottom-0 before:left-10 before:top-20 before:w-px before:bg-border-default" />
                    <FormField
                      control={form.control}
                      name={`${conditionKey}.${index}.logical_operator`}
                      render={({ field: logicField }) => (
                        <FormItem>
                          <FormControl>
                            <Select
                              value={logicField.value}
                              onValueChange={logicField.onChange}
                            >
                              <SelectTrigger className="h-10 min-w-20 rounded-radius-md border border-border-default bg-surface-primary px-space-sm py-space-xs text-sm shadow-elevation-low">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SwitchLogicOperatorOptions.map((operator) => (
                                  <SelectItem key={operator} value={operator}>
                                    {t(
                                      `flow.switchLogicOperatorOptions.${operator}`,
                                      operator.toUpperCase(),
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
                    <div className="relative w-1 flex-1 before:absolute before:bottom-36 before:left-10 before:top-0 before:w-px before:bg-border-default" />
                  </section>
                )}
                <ConditionCards
                  name={name}
                  nodeId={node?.id}
                  removeParent={remove}
                  parentIndex={index}
                  parentLength={fields.length}
                />
              </section>
              <Separator />
            </section>
          )
        })}
        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed border-border-default"
          onClick={() =>
            append({
              logical_operator: SwitchLogicOperatorOptions[0],
              [itemKey]: [
                {
                  cpn_id: '',
                  operator: SwitchOperatorOptions[0]?.value || '',
                },
              ],
              to: [],
            })
          }
        >
          <Plus className="size-4" />
          {t('common.add')}
        </Button>
      </FormWrapper>
    </Form>
  )
}

export default memo(SwitchForm)
