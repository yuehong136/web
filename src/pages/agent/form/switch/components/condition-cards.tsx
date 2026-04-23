import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
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
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
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
    <section className="flex min-w-0 flex-1 flex-col gap-space-sm">
      {fields.map((field, index) => (
        <div key={field.id} className="flex">
          <Card
            className={cn(
              'relative flex min-w-0 flex-1 rounded-radius-md border border-border-default bg-surface-primary shadow-elevation-low',
              {
                'before:absolute before:-left-10 before:top-1/2 before:h-px before:w-10 before:bg-border-default':
                  fields.length > 1 &&
                  (index === 0 || index === fields.length - 1),
              },
            )}
          >
            <section className="flex items-center justify-between rounded-t-radius-md bg-surface-secondary p-space-sm">
              <QueryVariable
                name={`${name}.${index}.cpn_id`}
                hideLabel
                nodeId={nodeId}
                className="min-w-0 flex-1"
                triggerClassName="h-9 rounded-radius-md border border-border-default bg-surface-primary px-space-sm py-space-xs text-sm"
              />
              <div className="flex items-center">
                <Separator orientation="vertical" className="h-3" />
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
                          <SelectTrigger className="h-9 w-28 rounded-radius-md border border-border-default bg-surface-primary px-space-sm py-space-xs text-sm">
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
                        className="min-h-24 rounded-radius-md border border-border-default bg-surface-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          <Button
            type="button"
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
          onClick={() =>
            append({
              cpn_id: '',
              operator: SwitchOperatorOptions[0]?.value || '',
            })
          }
        >
          {t('common.add')}
        </Button>
      </div>
    </section>
  )
}
