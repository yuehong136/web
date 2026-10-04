import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from './utils'

const tagVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0',
  {
    variants: {
      variant: {
        default:
          'border-components-badge-border bg-components-badge-bg text-components-badge-text',
        outline:
          'border-border-default bg-background-surface text-text-primary',
        success:
          'border-transparent bg-components-badge-success-bg text-components-badge-success-text',
        warning:
          'border-transparent bg-components-badge-warning-bg text-components-badge-warning-text',
        error:
          'border-transparent bg-components-badge-error-bg text-components-badge-error-text',
        info: 'border-transparent bg-components-badge-info-bg text-components-badge-info-text',
      },
      size: {
        sm: 'h-6 px-2 text-[11px] rounded-full',
        md: 'h-7 px-2.5 text-xs rounded-full',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
)

export interface TagProps
  extends React.ComponentProps<'span'>, VariantProps<typeof tagVariants> {
  closable?: boolean
  onClose?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

export function Tag({
  className,
  variant,
  size,
  children,
  closable,
  onClose,
  ...props
}: TagProps) {
  return (
    <span
      data-slot="tag"
      className={cn(tagVariants({ variant, size }), className)}
      {...props}
    >
      {children}
      {closable && (
        <button
          type="button"
          aria-label="移除标签"
          className="ml-0.5 inline-flex items-center justify-center rounded-full outline-hidden hover:opacity-80 focus-visible:ring-[3px] focus-visible:ring-state-focus/20"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </span>
  )
}

export { tagVariants }
