import { Button } from '@/components/ui/button'
import { FormLabel } from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  type FieldArray,
  type FieldArrayPath,
  type FieldValues,
  useFieldArray,
  useFormContext,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { CompactRecordRenderer } from './types'

type CompactRecordListProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
> = {
  name: TName
  label?: ReactNode
  description?: ReactNode
  addLabel?: ReactNode
  emptyLabel?: ReactNode
  defaultValue: FieldArray<TFieldValues, TName>
  className?: string
  rowsClassName?: string
  children: CompactRecordRenderer<TFieldValues, TName>
}

export function CompactRecordList<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
>({
  name,
  label,
  description,
  addLabel,
  emptyLabel,
  defaultValue,
  className,
  rowsClassName,
  children,
}: CompactRecordListProps<TFieldValues, TName>) {
  const { t } = useTranslation()
  const form = useFormContext<TFieldValues>()
  const fieldArray = useFieldArray<TFieldValues, TName>({
    control: form.control,
    name,
  })

  const { fields, append, remove, move, insert } = fieldArray
  const ctx = { fields, append, remove, move, insert }

  const headerVisible = Boolean(label || addLabel)

  return (
    <section className={cn('space-y-space-sm', className)}>
      {headerVisible && (
        <div className="flex items-center justify-between gap-space-sm">
          <div className="space-y-space-xs">
            {label && <FormLabel className="text-sm">{label}</FormLabel>}
            {description && (
              <p className="text-xs text-text-secondary">{description}</p>
            )}
          </div>
          {addLabel !== null && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => append(defaultValue)}
            >
              <Plus className="mr-space-xs size-4" />
              {addLabel ?? t('common.add', 'Add')}
            </Button>
          )}
        </div>
      )}

      {fields.length === 0 ? (
        <div className="rounded-radius-md border border-dashed border-border-default px-space-base py-space-sm text-center text-xs text-text-secondary">
          {emptyLabel ?? t('common.noData', 'No items yet')}
        </div>
      ) : (
        <div className={cn('space-y-space-xs', rowsClassName)}>
          {fields.map((field, index) => children({ field, index, ctx }))}
        </div>
      )}
    </section>
  )
}
