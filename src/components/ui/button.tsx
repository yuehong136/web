import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from './utils'
import { LoaderCircle } from 'lucide-react'

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-[var(--control-gap)] whitespace-nowrap rounded-radius-md border border-transparent text-sm font-medium transition-colors duration-(--motion-fast) disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-icon-sm [&_svg]:shrink-0 outline-hidden focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
  {
    variants: {
      variant: {
        default:
          'border-action-bg bg-action-bg text-action-fg hover:border-action-bg-hover hover:bg-action-bg-hover active:bg-action-bg-hover',
        destructive:
          'bg-danger-solid text-danger-on-solid hover:bg-danger-solid-hover',
        // DreamJira "secondary": a bordered surface button.
        outline:
          'border-line bg-surface text-fg hover:border-line-strong hover:bg-fill-hover',
        secondary: 'bg-fill-muted text-fg hover:bg-fill-pressed',
        ghost: 'text-fg-muted hover:bg-fill-hover hover:text-fg',
        link: 'text-accent-fg underline-offset-4 hover:underline',
        success:
          'bg-success-solid text-success-on-solid hover:bg-success-solid-hover',
        warning:
          'bg-warning-solid text-warning-on-solid hover:bg-warning-solid-hover',
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
