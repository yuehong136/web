import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const inputVariants = cva(
  'flex w-full rounded-xl border bg-components-input-bg px-4 py-3 text-sm text-components-input-text file:border-0 file:bg-transparent file:text-sm file:font-medium focus:bg-components-input-bg-focus focus:ring-0 focus-visible:ring-0 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-components-input-border focus:border-components-input-border-focus',
        destructive: 'border-components-input-border-error',
        success: 'border-status-success',
        warning: 'border-status-warning',
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
      'aria-invalid': ariaInvalid,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const reactId = React.useId()
    const inputId = id || reactId
    const hasError = !!error
    const messageId = `${inputId}-message`
    const describedBy =
      [ariaDescribedBy, error || helpText ? messageId : undefined]
        .filter(Boolean)
        .join(' ') || undefined

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-primary"
          >
            {label}
            {required && <span className="ml-1 text-status-error">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute top-1/2 left-4 -translate-y-1/2 transform text-text-tertiary">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              inputVariants({
                variant: hasError ? 'destructive' : variant,
                inputSize,
              }),
              leftIcon && 'pl-11',
              rightIcon && 'pr-11',
              className,
            )}
            ref={ref}
            id={inputId}
            aria-invalid={hasError || ariaInvalid}
            aria-describedby={describedBy}
            {...props}
          />
          {rightIcon && (
            <div className="absolute top-1/2 right-4 -translate-y-1/2 transform text-text-tertiary">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p
            id={messageId}
            className="flex items-center gap-1 text-sm text-status-error"
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
          <p id={messageId} className="text-sm text-text-tertiary">
            {helpText}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

export { Input, inputVariants }
