import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const loadingVariants = cva("", {
  variants: {
    variant: {
      spinner: "animate-spin rounded-full border-2 border-current border-t-transparent",
      dots: "flex space-x-1",
      pulse: "animate-pulse bg-current rounded",
      wave: "flex space-x-1",
    },
    size: {
      sm: "",
      md: "",
      lg: "",
      xl: "",
    },
  },
  compoundVariants: [
    {
      variant: "spinner",
      size: "sm",
      class: "h-4 w-4",
    },
    {
      variant: "spinner",
      size: "md",
      class: "h-6 w-6",
    },
    {
      variant: "spinner",
      size: "lg",
      class: "h-8 w-8",
    },
    {
      variant: "spinner",
      size: "xl",
      class: "h-12 w-12",
    },
  ],
  defaultVariants: {
    variant: "spinner",
    size: "md",
  },
})

export interface LoadingProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingVariants> {
  text?: string
  overlay?: boolean
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, variant, size, text, overlay, ...props }, ref) => {
    const LoadingIcon = () => {
      switch (variant) {
        case "spinner":
          return <div className={cn(loadingVariants({ variant, size }))} />
        
        case "dots":
          return (
            <div className={cn(loadingVariants({ variant }))}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-full bg-current animate-pulse",
                    size === "sm" && "h-1 w-1",
                    size === "md" && "h-2 w-2",
                    size === "lg" && "h-3 w-3",
                    size === "xl" && "h-4 w-4"
                  )}
                  style={{
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )
        
        case "pulse":
          return (
            <div
              className={cn(
                loadingVariants({ variant }),
                size === "sm" && "h-4 w-16",
                size === "md" && "h-6 w-24",
                size === "lg" && "h-8 w-32",
                size === "xl" && "h-12 w-48"
              )}
            />
          )
        
        case "wave":
          return (
            <div className={cn(loadingVariants({ variant }))}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "bg-current animate-pulse",
                    size === "sm" && "h-4 w-1",
                    size === "md" && "h-6 w-1",
                    size === "lg" && "h-8 w-1",
                    size === "xl" && "h-12 w-2"
                  )}
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: "0.6s",
                  }}
                />
              ))}
            </div>
          )
        
        default:
          return <div className={cn(loadingVariants({ variant, size }))} />
      }
    }

    if (overlay) {
      return (
        <div
          ref={ref}
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm",
            className
          )}
          {...props}
        >
          <div className="flex flex-col items-center space-y-4">
            <LoadingIcon />
            {text && (
              <p className="text-sm text-gray-600 animate-pulse">{text}</p>
            )}
          </div>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        <div className="flex flex-col items-center space-y-2">
          <LoadingIcon />
          {text && (
            <p className="text-sm text-gray-600">{text}</p>
          )}
        </div>
      </div>
    )
  }
)

Loading.displayName = "Loading"

// Skeleton component for content loading states
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number
  width?: string
  height?: string
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, lines = 1, width, height, ...props }, ref) => {
    if (lines === 1) {
      return (
        <div
          ref={ref}
          className={cn(
            "animate-pulse rounded bg-gray-200",
            className
          )}
          style={{ width, height: height || "1rem" }}
          {...props}
        />
      )
    }

    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded bg-gray-200 h-4"
            style={{
              width: i === lines - 1 ? "75%" : "100%",
            }}
          />
        ))}
      </div>
    )
  }
)

Skeleton.displayName = "Skeleton"

// Spinner component (alias for Loading with spinner variant)
export const Spinner: React.FC<Omit<LoadingProps, 'variant'>> = (props) => (
  <Loading variant="spinner" {...props} />
)

export { Loading, loadingVariants }