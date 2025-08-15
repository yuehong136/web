import * as React from 'react'
import { cn } from './utils'

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn('resize-none border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex min-h-16 w-full rounded-md border bg-input-background px-3 py-2 text-base outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:border-ring hover:border-input/80 dark:bg-input/30', className)}
      {...props}
    />
  )
}


