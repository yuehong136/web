import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from './utils'

const cardVariants = cva(
  // DreamJira panel: 12px corners, a hairline border and the card shadow.
  'rounded-radius-xl border bg-raised text-fg shadow-elevation-low transition-colors duration-(--motion-fast) motion-reduce:transition-none',
  {
    variants: {
      variant: {
        default: 'border-line-subtle',
        outline: 'border-line-strong shadow-none',
        elevated: 'border-line-subtle shadow-elevation-medium',
        interactive:
          'cursor-pointer border-line-subtle hover:border-line-strong hover:bg-raised-hover',
      },
      padding: {
        none: '',
        sm: 'p-space-md',
        default: 'p-space-lg',
        lg: 'p-space-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
    },
  },
)

export interface CardProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  ),
)

Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-space-xs p-space-lg', className)}
    {...props}
  />
))

CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-base leading-6 font-semibold text-fg', className)}
    {...props}
  />
))

CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-fg-muted', className)} {...props} />
))

CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-space-lg pt-0', className)} {...props} />
))

CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center gap-space-sm p-space-lg pt-0', className)}
    {...props}
  />
))

CardFooter.displayName = 'CardFooter'

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
}
