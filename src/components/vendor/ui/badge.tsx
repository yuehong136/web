import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from './utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-state-focus focus-visible:ring-state-focus/20 focus-visible:ring-[3px] aria-invalid:ring-status-error/20 aria-invalid:border-status-error transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-components-badge-border bg-components-badge-bg text-components-badge-text [a&]:hover:bg-state-hover',
        secondary:
          'border-transparent bg-components-badge-neutral-bg text-components-badge-neutral-text [a&]:hover:bg-state-hover',
        destructive:
          'border-transparent bg-components-badge-error-bg text-components-badge-error-text [a&]:hover:bg-status-error-10',
        outline:
          'border-border-default text-text-primary [a&]:hover:bg-state-hover',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

type BadgeProps = React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }

export function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : 'span'
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { badgeVariants }
