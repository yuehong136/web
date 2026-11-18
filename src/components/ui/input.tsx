import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { CircleAlert } from 'lucide-react'

const inputVariants = cva(
  // DreamJira input: the border turns to the focus colour and a one-pixel
  // ring doubles it, so focus never depends on a hairline alone.
  'flex w-full min-w-0 rounded-radius-md border bg-surface px-[var(--control-padding-x)] py-space-xs text-sm text-fg transition-colors duration-150 placeholder:text-fg-subtle file:border-0 file:bg-transparent file:text-sm file:font-medium focus:bg-surface focus-visible:ring-1 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
  {
    variants: {
      variant: {
        default:
          'border-line hover:border-line-strong focus:border-line-focus focus-visible:ring-line-focus',
        destructive:
          'border-danger-solid focus:border-danger-solid focus-visible:ring-danger-solid',
        success: 'border-success-fg focus-visible:ring-success-fg',
        warning: 'border-warning-fg focus-visible:ring-warning-fg',
      },
      inputSize: {
        default: 'min-h-[var(--control-height)]',
        sm: 'min-h-[var(--control-height-sm)] px-[var(--control-padding-x-sm)]',
        lg: 'min-h-[var(--control-height-lg)] px-[var(--control-padding-x-lg)]',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
    },
  },
)

export interface InputProps
  extends
    React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  error?: string
  helpText?: string
  label?: string
  required?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      inputSize,
      type,
      leftIcon,
      rightIcon,
      error,
      helpText,
      label,
      required,
      id,
      style,
      ...props
    },
    ref,
  ) => {
    const reactId = React.useId()
    const inputId = id || reactId
    const hasError = !!error
    const effectiveVariant = hasError ? 'destructive' : variant

    return (
      <div className="space-y-space-xs">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-fg">
            {label}
            {required && <span className="ml-space-xs text-danger-fg">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute top-1/2 left-space-base -translate-y-1/2 transform text-fg-subtle">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              inputVariants({ variant: effectiveVariant, inputSize }),
              leftIcon && 'pl-11',
              rightIcon && 'pr-11',
              className,
            )}
            style={style}
            ref={ref}
            id={inputId}
            {...props}
            required={required}
            aria-invalid={hasError || props['aria-invalid'] || undefined}
            aria-describedby={
              [
                props['aria-describedby'],
                error || helpText ? `${inputId}-hint` : undefined,
              ]
                .filter(Boolean)
                .join(' ') || undefined
            }
          />
          {rightIcon && (
            <div className="absolute top-1/2 right-space-base -translate-y-1/2 transform text-fg-subtle">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-hint`}
            className="flex items-center gap-space-xs text-sm text-danger-fg"
          >
            <CircleAlert className="size-icon-sm" aria-hidden="true" />
            {error}
          </p>
        )}
        {helpText && !error && (
          <p id={`${inputId}-hint`} className="text-sm text-fg-subtle">
            {helpText}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

export { Input, inputVariants }
