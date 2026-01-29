import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, style, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false)
      onBlur?.(e)
    }

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border px-4 py-3 text-sm focus:ring-0 focus-visible:ring-0 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none",
          className
        )}
        style={{
          backgroundColor: isFocused ? 'var(--color-components-input-bg-focus)' : 'var(--color-components-input-bg)',
          borderColor: isFocused ? 'var(--color-components-input-border-focus)' : 'var(--color-components-input-border)',
          color: 'var(--color-text-primary)',
          ...style
        }}
        ref={ref}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }