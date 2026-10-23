import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from './utils'
import { LoaderCircle } from 'lucide-react'

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-[var(--control-gap)] whitespace-nowrap rounded-radius-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-icon-sm [&_svg]:shrink-0 outline-hidden focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background-surface",
  {
    variants: {
      variant: {
        default:
          'border border-components-button-primary-border bg-components-button-primary-bg text-components-button-primary-text hover:border-components-button-primary-border-hover hover:bg-components-button-primary-bg-hover active:bg-components-button-primary-bg-active',
        destructive: 'bg-status-error text-text-inverted hover:brightness-90',
        outline:
          'border border-components-button-secondary-border bg-components-button-secondary-bg text-components-button-secondary-text hover:border-components-button-secondary-border-hover hover:bg-components-button-secondary-bg-hover',
        secondary:
          'bg-components-button-secondary-bg text-components-button-secondary-text hover:bg-components-button-secondary-bg-hover',
        ghost:
          'hover:bg-components-button-ghost-bg-hover text-components-button-ghost-text',
        link: 'text-text-accent underline-offset-4 hover:underline',
        success: 'bg-status-success text-text-inverted hover:brightness-90',
        warning: 'bg-status-warning text-text-inverted hover:brightness-90',
      },
      size: {
        default:
          'min-h-[var(--control-height)] px-[var(--control-padding-x)] py-space-xs',
        sm: 'min-h-[var(--control-height-sm)] px-[var(--control-padding-x-sm)] py-space-xs',
        lg: 'min-h-[var(--control-height-lg)] px-[var(--control-padding-x-lg)] py-space-sm',
        xl: 'min-h-[var(--control-height-lg)] rounded-radius-lg px-space-xl py-space-base text-base',
        icon: 'size-[var(--control-height)]',
        'icon-sm': 'size-[var(--control-height-sm)]',
        'icon-lg': 'size-[var(--control-height-lg)]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...restProps
    },
    ref,
  ) => {
    const isDisabled = disabled || loading
    const props = {
      ...(restProps as typeof restProps & {
        ref?: React.Ref<HTMLButtonElement>
      }),
    }

    delete props.ref

    const renderContent = (content: React.ReactNode) => (
      <>
        {loading && (
          <LoaderCircle
            className="size-icon-sm animate-spin"
            aria-hidden="true"
          />
        )}
        {!loading && leftIcon && (
          <span className="inline-flex">{leftIcon}</span>
        )}
        {content}
        {!loading && rightIcon && (
          <span className="inline-flex">{rightIcon}</span>
        )}
      </>
    )

    if (
      asChild &&
      React.Children.count(children) === 1 &&
      React.isValidElement(children) &&
      children.type !== React.Fragment
    ) {
      const child = children as React.ReactElement<{
        children?: React.ReactNode
        className?: string
        disabled?: boolean
      }>

      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          aria-disabled={isDisabled || undefined}
          aria-busy={loading || undefined}
          data-disabled={isDisabled ? '' : undefined}
          {...props}
        >
          {React.cloneElement(child, {
            className: cn(child.props.className),
            disabled: child.props.disabled ?? isDisabled,
            children: renderContent(child.props.children),
          })}
        </Slot>
      )
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        data-disabled={isDisabled ? '' : undefined}
        {...props}
      >
        {renderContent(children)}
      </button>
    )
  },
)

Button.displayName = 'Button'

export { Button, buttonVariants }
