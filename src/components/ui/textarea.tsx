import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border border-components-input-border bg-components-input-bg px-4 py-3 text-sm text-text-primary placeholder:text-components-input-text-placeholder focus-visible:outline-none focus-visible:border-components-input-border-focus focus-visible:bg-components-input-bg-focus disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-components-input-bg-disabled transition-colors resize-none",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }