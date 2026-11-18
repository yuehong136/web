import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const textareaVariants = cva(
  'flex w-full resize-none text-sm text-fg transition-colors duration-150 placeholder:text-fg-subtle focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
  {
    variants: {
      variant: {
        default:
          'min-h-24 rounded-radius-md border border-line bg-surface px-[var(--control-padding-x)] py-space-sm hover:border-line-strong focus:border-line-focus focus:bg-surface focus-visible:ring-1 focus-visible:ring-line-focus aria-invalid:border-danger-solid',
        chat: 'bg-transparent border-none',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface TextareaProps
  extends
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, ...props }, ref) => (
    <textarea
      className={cn(textareaVariants({ variant }), className)}
      ref={ref}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'

export { Textarea, textareaVariants }
