import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const textareaVariants = cva(
  'flex w-full resize-none text-sm text-text-primary transition-colors duration-150 placeholder:text-components-input-text-placeholder focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
  {
    variants: {
      variant: {
        default:
          'min-h-24 rounded-radius-md border border-components-input-border bg-components-input-bg px-[var(--control-padding-x)] py-space-sm hover:border-components-input-border-hover focus:border-components-input-border-focus focus:bg-components-input-bg-focus focus-visible:ring-1 focus-visible:ring-state-focus aria-invalid:border-components-input-border-error',
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
