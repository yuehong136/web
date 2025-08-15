import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from './utils'

const tagVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-accent text-accent-foreground border-border',
        outline: 'bg-card text-foreground border-border',
        success: 'border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        warning: 'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
        error: 'border-transparent bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        info: 'border-transparent bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      },
      size: {
        sm: 'h-6 px-2 text-[11px] rounded-full',
        md: 'h-7 px-2.5 text-xs rounded-full',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  }
)

export interface TagProps extends React.ComponentProps<'span'>, VariantProps<typeof tagVariants> {
  closable?: boolean
  onClose?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

export function Tag({ className, variant, size, children, closable, onClose, ...props }: TagProps) {
  return (
    <span data-slot="tag" className={cn(tagVariants({ variant, size }), className)} {...props}>
      {children}
      {closable && (
        <button
          type="button"
          aria-label="移除标签"
          className="ml-0.5 inline-flex items-center justify-center rounded-full hover:opacity-80 focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </span>
  )
}

export { tagVariants }


