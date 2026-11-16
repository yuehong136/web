import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface SegmentedChoiceOption<T extends string> {
  value: T
  label: ReactNode
}

interface SegmentedChoiceProps<T extends string> extends Omit<
  ComponentPropsWithoutRef<'fieldset'>,
  'onChange'
> {
  value: T
  options: readonly SegmentedChoiceOption<T>[]
  onValueChange: (value: T) => void
}

/**
 * Full-width single-choice switch for operator forms: a fieldset of
 * pressed/unpressed buttons. Extra props (FormControl id / aria-*, an
 * aria-label / aria-labelledby naming the group, `disabled`) land on the
 * fieldset.
 */
export function SegmentedChoice<T extends string>({
  value,
  options,
  onValueChange,
  className,
  ...props
}: SegmentedChoiceProps<T>) {
  return (
    <fieldset
      className={cn(
        'flex w-full gap-space-2xs rounded-radius-lg border border-components-segmented-border bg-components-segmented-bg p-space-2xs',
        className,
      )}
      {...props}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant="ghost"
            aria-pressed={selected}
            className={cn(
              'flex-1 text-components-segmented-item-text hover:bg-components-segmented-item-bg-hover',
              selected &&
                'bg-components-segmented-item-bg-active text-components-segmented-item-text-active shadow-elevation-low hover:bg-components-segmented-item-bg-active',
            )}
            onClick={() => onValueChange(option.value)}
          >
            {option.label}
          </Button>
        )
      })}
    </fieldset>
  )
}
