import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const inputVariants = cva(
  'flex w-full rounded-xl border px-4 py-3 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus:ring-0 focus-visible:ring-0 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
  {
    variants: {
      variant: {
        default: '',
        destructive: '',
        success: '',
        warning: '',
      },
      inputSize: {
        default: 'h-12',
        sm: 'h-10 text-xs',
        lg: 'h-14',
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
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const reactId = React.useId()
    const inputId = id || reactId
    const hasError = !!error
    const effectiveVariant = hasError ? 'destructive' : variant
    const [isFocused, setIsFocused] = React.useState(false)

    const getBorderColor = () => {
      if (isFocused) {
        switch (effectiveVariant) {
          case 'destructive':
            return 'var(--color-components-input-border-error)'
          case 'success':
            return 'var(--color-status-success-border)'
          case 'warning':
            return 'var(--color-status-warning-border)'
          default:
            return 'var(--color-components-input-border-focus)'
        }
      }
      switch (effectiveVariant) {
        case 'destructive':
          return 'var(--color-components-input-border-error)'
        case 'success':
          return 'var(--color-status-success-border)'
        case 'warning':
          return 'var(--color-status-warning-border)'
        default:
          return 'var(--color-components-input-border)'
      }
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      onBlur?.(e)
    }

    return (
      <div className="space-y-2">
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
                className="ml-1"
              >
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div
              className="absolute left-4 top-1/2 -translate-y-1/2 transform"
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
            style={{
              backgroundColor: isFocused
                ? 'var(--color-components-input-bg-focus)'
                : 'var(--color-components-input-bg)',
              borderColor: getBorderColor(),
              color: 'var(--color-components-input-text)',
              ...style,
            }}
            ref={ref}
            id={inputId}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
          {rightIcon && (
            <div
              className="absolute right-4 top-1/2 -translate-y-1/2 transform"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p
            className="flex items-center gap-1 text-sm"
            style={{ color: 'var(--color-status-error-text)' }}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
        {helpText && !error && (
          <p
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
