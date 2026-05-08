import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./utils"

const methodBadgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap shrink-0 transition-colors",
  {
    variants: {
      method: {
        GET: "bg-components-method-get-bg text-components-method-get-text border-components-method-get-border",
        POST: "bg-components-method-post-bg text-components-method-post-text border-components-method-post-border",
        PUT: "bg-components-method-put-bg text-components-method-put-text border-components-method-put-border",
        DELETE: "bg-components-method-delete-bg text-components-method-delete-text border-components-method-delete-border",
        PATCH: "bg-components-method-patch-bg text-components-method-patch-text border-components-method-patch-border",
        HEAD: "bg-background-subtle text-text-secondary border-border-default",
        OPTIONS: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-800",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      method: "GET" as const,
      size: "default" as const,
    },
  }
)

export interface MethodBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof methodBadgeVariants> {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS"
}

const MethodBadge = React.forwardRef<HTMLSpanElement, MethodBadgeProps>(
  ({ className, method, size, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(methodBadgeVariants({ method, size }), className)}
      {...props}
    >
      {method}
    </span>
  )
)

MethodBadge.displayName = "MethodBadge"

export { MethodBadge, methodBadgeVariants }