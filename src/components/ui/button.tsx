import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from './utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-1 focus-visible:ring-state-focus",
  {
    variants: {
      variant: {
        default:
          'bg-components-button-primary-bg text-components-button-primary-text shadow-sm hover:bg-components-button-primary-bg-hover active:bg-components-button-primary-bg-active border border-components-button-primary-border hover:border-components-button-primary-border-hover',
        destructive:
          'bg-status-error text-text-inverted shadow-sm hover:brightness-90',
        outline:
          'border bg-components-button-secondary-bg text-components-button-secondary-text shadow-sm hover:bg-components-button-secondary-bg-hover border-components-button-secondary-border hover:border-components-button-secondary-border-hover',
        secondary:
          'bg-components-button-secondary-bg text-components-button-secondary-text shadow-sm hover:bg-components-button-secondary-bg-hover',
        ghost:
          'hover:bg-components-button-ghost-bg-hover text-components-button-ghost-text',
        link: 'text-text-accent underline-offset-4 hover:underline',
        success:
          'bg-status-success text-text-inverted shadow-sm hover:brightness-90',
        warning:
          'bg-status-warning text-text-inverted shadow-sm hover:brightness-90',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        xl: 'h-12 rounded-lg px-10 text-base',
        icon: 'size-9 rounded-md',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
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
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {content}
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
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
