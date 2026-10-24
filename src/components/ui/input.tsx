import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { CircleAlert } from 'lucide-react'

const inputVariants = cva(
  'flex w-full rounded-radius-md border bg-components-input-bg px-[var(--control-padding-x)] py-space-xs text-sm text-components-input-text transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus:bg-components-input-bg-focus focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border-components-input-border focus:border-components-input-border-focus',
        destructive:
          'border-components-input-border-error focus:border-components-input-border-error',
        success: 'border-status-success',
        warning: 'border-status-warning',
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
          <label
            htmlFor={inputId}
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {label}
            {required && (
              <span
                style={{ color: 'var(--color-status-error-text)' }}
                className="ml-space-xs"
              >
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div
              className="absolute top-1/2 left-space-base -translate-y-1/2 transform"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
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
            <div
              className="absolute top-1/2 right-space-base -translate-y-1/2 transform"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-hint`}
            className="flex items-center gap-space-xs text-sm"
            style={{ color: 'var(--color-status-error-text)' }}
          >
            <CircleAlert className="size-icon-sm" aria-hidden="true" />
            {error}
          </p>
        )}
        {helpText && !error && (
          <p
            id={`${inputId}-hint`}
            className="text-sm"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {helpText}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

export { Input, inputVariants }
