import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "./utils"

const statusIndicatorVariants = cva(
  "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
  {
    variants: {
      status: {
        online: "bg-components-api-status-online-bg text-components-api-status-online-text",
        offline: "bg-components-api-status-offline-bg text-components-api-status-offline-text",
        error: "bg-components-api-status-error-bg text-components-api-status-error-text",
      },
      size: {
        default: "px-3 py-1.5 text-sm",
        sm: "px-2 py-1 text-xs",
        lg: "px-4 py-2 text-base",
      },
    },
    defaultVariants: {
      status: "offline",
      size: "default",
    },
  }
)

const dotVariants = cva(
  "w-2 h-2 rounded-full shrink-0",
  {
    variants: {
      status: {
        online: "bg-components-api-status-online-dot",
        offline: "bg-components-api-status-offline-dot",
        error: "bg-components-api-status-error-dot animate-pulse",
      },
    },
    defaultVariants: {
      status: "offline",
    },
  }
)

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusIndicatorVariants> {
  showDot?: boolean
  label?: string
}

const StatusIndicator = React.forwardRef<HTMLSpanElement, StatusIndicatorProps>(
  ({ className, status, size, showDot = true, label, children, ...props }, ref) => {
    const statusLabels = {
      online: label || "Online",
      offline: label || "Offline",
      error: label || "Error",
    }

    return (
      <span
        ref={ref}
        className={cn(statusIndicatorVariants({ status, size }), className)}
        {...props}
      >
        {showDot && <span className={cn(dotVariants({ status }))} />}
        {children || statusLabels[status || "offline"]}
      </span>
    )
  }
)

StatusIndicator.displayName = "StatusIndicator"

export { StatusIndicator, statusIndicatorVariants }