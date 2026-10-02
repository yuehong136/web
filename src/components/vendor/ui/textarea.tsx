import * as React from 'react'
import { cn } from './utils'

export function Textarea({
  className,
  ...props
}: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-16 w-full resize-none rounded-md border border-input bg-input px-3 py-2 text-base outline-hidden selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground hover:border-input/80 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        className,
      )}
      {...props}
    />
  )
}
