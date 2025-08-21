import * as React from "react"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fallback?: React.ReactNode
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8', 
  lg: 'h-10 w-10',
  xl: 'h-12 w-12'
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, size = 'lg', fallback, ...props }, ref) => {
    const [imgError, setImgError] = React.useState(false)
    const [imgLoaded, setImgLoaded] = React.useState(false)

    const handleImageError = () => {
      setImgError(true)
    }

    const handleImageLoad = () => {
      setImgLoaded(true)
      setImgError(false)
    }

    React.useEffect(() => {
      // Reset state when src changes
      if (src) {
        setImgError(false)
        setImgLoaded(false)
      }
    }, [src])

    const showFallback = !src || imgError || !imgLoaded

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full bg-background-subtle",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {src && !imgError && (
          <img
            src={src}
            alt={alt || ''}
            className={cn(
              "h-full w-full object-cover",
              imgLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        )}
        {showFallback && (
          <AvatarFallback>
            {fallback}
          </AvatarFallback>
        )}
      </div>
    )
  }
)

Avatar.displayName = "Avatar"

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-background-subtle text-text-secondary font-medium text-sm",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarFallback }