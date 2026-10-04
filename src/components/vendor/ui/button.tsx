import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from './utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-state-focus disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          'bg-components-button-primary-bg text-components-button-primary-text shadow-sm hover:bg-components-button-primary-bg-hover active:bg-components-button-primary-bg-active',
        destructive:
          'bg-status-error text-text-inverted shadow-xs hover:brightness-90',
        outline:
          'border border-components-button-secondary-border bg-components-button-secondary-bg text-components-button-secondary-text shadow-xs hover:border-components-button-secondary-border-hover hover:bg-components-button-secondary-bg-hover',
        secondary:
          'bg-components-button-secondary-bg text-components-button-secondary-text shadow-xs hover:bg-components-button-secondary-bg-hover',
        ghost:
          'text-components-button-ghost-text hover:bg-components-button-ghost-bg-hover',
        link: 'text-text-accent underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { buttonVariants }
