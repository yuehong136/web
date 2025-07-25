import * as React from "react"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  fallback?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = 'md', ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false)
    
    const sizeClasses = {
      sm: 'h-6 w-6',
      md: 'h-8 w-8', 
      lg: 'h-10 w-10',
      xl: 'h-12 w-12'
    }

    const handleImageError = () => {
      setImageError(true)
    }

    // 重置错误状态当src改变时
    React.useEffect(() => {
      setImageError(false)
    }, [src])

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-lg",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt}
            className="aspect-square h-full w-full object-cover"
            onError={handleImageError}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary-100 text-primary-600">
            {fallback}
          </div>
        )}
      </div>
    )
  }
)

Avatar.displayName = "Avatar"

export { Avatar }