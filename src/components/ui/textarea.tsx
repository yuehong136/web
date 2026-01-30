import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const textareaVariants = cva(
  "flex w-full text-sm focus:ring-0 focus-visible:ring-0 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none",
  {
    variants: {
      variant: {
        default: "min-h-[80px] rounded-xl border px-4 py-3",
        chat: "bg-transparent border-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, style, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false)
      onBlur?.(e)
    }

    // chat 变体使用透明背景，不需要动态样式
    const getStyles = (): React.CSSProperties => {
      if (variant === "chat") {
        return {
          color: 'var(--color-text-primary)',
          ...style
        }
      }
      return {
        backgroundColor: isFocused ? 'var(--color-components-input-bg-focus)' : 'var(--color-components-input-bg)',
        borderColor: isFocused ? 'var(--color-components-input-border-focus)' : 'var(--color-components-input-border)',
        color: 'var(--color-text-primary)',
        ...style
      }
    }

    return (
      <textarea
        className={cn(textareaVariants({ variant }), className)}
        style={getStyles()}
        ref={ref}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }