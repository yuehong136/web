import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
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
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Plus, X } from 'lucide-react'
import { useCallback } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { SwitchOperatorOptions } from '../../../constant'
import { QueryVariable } from '../../components/query-variable'
import type { ConditionCardsProps } from '../types'

const itemKey = 'items'

export function ConditionCards({
  name: parentName,
  nodeId,
  parentIndex,
  removeParent,
  parentLength,
}: ConditionCardsProps) {
  const form = useFormContext()
  const { t } = useTranslation()

  const name = `${parentName}.${itemKey}`
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
    <section className="min-w-0 flex-1 space-y-space-sm">
      {fields.map((field, index) => (
        <div key={field.id} className="group flex min-w-0 items-start">
          <Card
            className={cn(
              'relative min-w-0 flex-1 overflow-visible rounded-radius-md border border-border-default bg-transparent p-0 shadow-elevation-low transition-colors group-hover:border-border-strong',
              {
                'before:absolute before:-left-10 before:top-1/2 before:h-px before:w-10 before:bg-border-default':
                  fields.length > 1 &&
                  (index === 0 || index === fields.length - 1),
              },
            )}
          >
            <section className="grid min-w-0 items-center gap-space-sm rounded-t-radius-md bg-surface-secondary p-space-sm lg:grid-cols-[minmax(0,1fr)_8rem_auto]">
              <div className="min-w-0">
                <QueryVariable
                  name={`${name}.${index}.cpn_id`}
                  hideLabel
                  nodeId={nodeId}
                  className="min-w-0"
                  triggerClassName="h-10 rounded-radius-md border border-border-default bg-surface-primary px-space-sm py-space-xs text-sm shadow-none hover:bg-surface-secondary"
                />
              </div>
              <div className="min-w-0">
                <FormField
                  control={form.control}
                  name={`${name}.${index}.operator` as const}
                  render={({ field: operatorField }) => (
                    <FormItem>
                      <FormControl>
                        <Select
                          value={operatorField.value}
                          onValueChange={operatorField.onChange}
                        >
                          <SelectTrigger className="h-10 min-w-0 rounded-radius-md border border-border-default bg-surface-primary px-space-sm py-space-xs text-sm shadow-none hover:bg-surface-secondary">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SwitchOperatorOptions.map((operator) => (
                              <SelectItem
                                key={operator.value}
                                value={operator.value}
                              >
                                {t(
                                  `flow.switchOperatorOptions.${operator.label}`,
                                  operator.label,
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
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-text-secondary hover:text-status-error"
                onClick={handleRemove(index)}
                aria-label={t('common.remove')}
              >
                <X className="size-4" />
              </Button>
            </section>
            <CardContent className="p-space-md">
              <FormField
                control={form.control}
                name={`${name}.${index}.value` as const}
                render={({ field: valueField }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        {...valueField}
                        placeholder={t(
                          'flow.switchConditionValuePlaceholder',
                          'Enter the value to compare with...',
                        )}
                        className="min-h-24 rounded-radius-md border border-border-default bg-transparent px-space-md py-space-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>
      ))}
      <div className="pr-space-lg">
        <Button
          type="button"
          variant="outline"
          className="mt-space-sm w-full border-dashed border-border-default bg-surface-primary"
          onClick={() =>
            append({
              cpn_id: '',
              operator: SwitchOperatorOptions[0]?.value || '',
            })
          }
        >
          <Plus className="size-4" />
          {t('common.add')}
        </Button>
      </div>
    </section>
  )
}
