import * as React from 'react'
import * as RadioGroup from '@radix-ui/react-radio-group'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * DreamJira segmented geometry (`cm-seg`): a subtle track with a 2px inset
 * and a raised surface for the chosen item. Shared with the segmented
 * variant of Tabs so view switches and section tabs look the same.
 */
export const segmentedListVariants = cva(
  'inline-flex max-w-full items-center gap-space-2xs rounded-radius-md bg-background-subtle p-space-2xs',
  {
    variants: {
      disabled: { true: 'cursor-not-allowed opacity-50', false: '' },
    },
    defaultVariants: { disabled: false },
  },
)

export const segmentedItemVariants = cva(
  [
    'inline-flex min-w-0 shrink-0 items-center justify-center gap-space-xs rounded-radius-sm px-space-sm text-sm font-medium whitespace-nowrap text-text-secondary',
    'transition-colors duration-150 outline-hidden motion-reduce:transition-none',
    'hover:text-text-primary focus-visible:ring-2 focus-visible:ring-state-focus',
    'disabled:pointer-events-none disabled:opacity-50',
    // Radix RadioGroup marks the pick with data-state=checked, Tabs with active.
    'data-[state=active]:bg-background-surface data-[state=active]:text-text-primary data-[state=active]:ring-1 data-[state=active]:ring-border-default',
    'data-[state=checked]:bg-background-surface data-[state=checked]:text-text-primary data-[state=checked]:ring-1 data-[state=checked]:ring-border-default',
    "[&_svg:not([class*='size-'])]:size-icon-sm [&_svg]:shrink-0",
  ],
  {
    variants: {
      size: {
        sm: 'h-[calc(var(--control-height-sm)-var(--space-xs))]',
        md: 'h-[calc(var(--control-height)-var(--space-xs))]',
      },
      iconOnly: { true: 'aspect-square px-0', false: '' },
    },
    defaultVariants: { size: 'md', iconOnly: false },
  },
)

export interface SegmentedControlOption<T extends string = string> {
  value: T
  /**
   * Visible text. With `iconOnly` it becomes the item's accessible name and
   * hover title, so pass a string there.
   */
  label: React.ReactNode
  icon?: React.ReactNode
  disabled?: boolean
}

export interface SegmentedControlProps<T extends string = string> extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue' | 'dir'
> {
  value: T
  onValueChange: (value: T) => void
  options: readonly SegmentedControlOption<T>[]
  /** Show only icons; labels become each item's name and hover title. */
  iconOnly?: boolean
  size?: 'sm' | 'md'
  /** Stretch across the container with equal-width items, e.g. in forms. */
  fullWidth?: boolean
  disabled?: boolean
}

/**
 * One choice out of a few, always visible: view switches, scopes, modes and
 * short form choices. It is a Radix radio group: Tab enters at the chosen
 * item, arrow keys move and choose, and the choice is exposed as a checked
 * radio, never by colour alone.
 * Name the group with `aria-label` or `aria-labelledby`; other attributes
 * (a form field's id and aria-describedby) land on the group.
 */
export function SegmentedControl<T extends string = string>({
  value,
  onValueChange,
  options,
  iconOnly = false,
  size = 'md',
  fullWidth = false,
  disabled = false,
  className,
  ...props
}: SegmentedControlProps<T>) {
  return (
    <RadioGroup.Root
      {...props}
      value={value}
      onValueChange={(next) => onValueChange(next as T)}
      disabled={disabled}
      orientation="horizontal"
      className={cn(
        segmentedListVariants({ disabled }),
        fullWidth && 'flex w-full',
        className,
      )}
    >
      {options.map((option) => {
        const name =
          iconOnly && typeof option.label === 'string'
            ? option.label
            : undefined
        return (
          <RadioGroup.Item
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            aria-label={name}
            title={name}
            className={cn(
              segmentedItemVariants({ size, iconOnly }),
              fullWidth && 'flex-1 shrink',
            )}
          >
            {option.icon ? (
              <span aria-hidden="true" className="inline-flex">
                {option.icon}
              </span>
            ) : null}
            {iconOnly ? null : <span className="truncate">{option.label}</span>}
          </RadioGroup.Item>
        )
      })}
    </RadioGroup.Root>
  )
}
