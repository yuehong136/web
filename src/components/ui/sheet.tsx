import * as React from 'react'
import * as SheetPrimitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'

import { cn } from './utils'
import { useActivePortalTheme, usePortalContainer } from './portal-theme'

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const sheetVariants = cva(
  'fixed z-50 gap-space-md border-border-default bg-background-surface p-space-lg text-text-primary shadow-elevation-high transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:duration-200 motion-reduce:animate-none',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom:
          'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
        right:
          'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  },
)

interface SheetContentProps
  extends
    React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  showCloseButton?: boolean
  showOverlay?: boolean
  closeLabel?: string
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(
  (
    {
      side = 'right',
      className,
      children,
      showCloseButton = true,
      showOverlay = true,
      closeLabel = 'Close',
      ...props
    },
    ref,
  ) => {
    const portalContainer = usePortalContainer()
    const theme = useActivePortalTheme(true)

    return (
      <SheetPortal container={portalContainer}>
        {showOverlay ? <SheetOverlay data-theme={theme} /> : null}
        <SheetPrimitive.Content
          ref={ref}
          data-theme={theme}
          className={cn(sheetVariants({ side }), className)}
          {...props}
        >
          {children}
          {showCloseButton && (
            <SheetPrimitive.Close className="absolute top-space-base right-space-base inline-flex size-[var(--control-height)] items-center justify-center rounded-radius-md text-text-secondary outline-hidden transition-colors hover:bg-state-hover hover:text-text-primary focus-visible:ring-2 focus-visible:ring-state-focus disabled:pointer-events-none">
              <X className="size-icon-sm" aria-hidden="true" />
              <span className="sr-only">{closeLabel}</span>
            </SheetPrimitive.Close>
          )}
        </SheetPrimitive.Content>
      </SheetPortal>
    )
  },
)
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-components-dialog-overlay motion-reduce:animate-none',
      className,
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col gap-space-xs pr-space-2xl text-center sm:text-left',
      className,
    )}
    {...props}
  />
)
SheetHeader.displayName = 'SheetHeader'

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse gap-space-sm sm:flex-row sm:justify-end',
      className,
    )}
    {...props}
  />
)
SheetFooter.displayName = 'SheetFooter'

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg leading-7 font-semibold text-text-primary',
      className,
    )}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn('text-sm text-text-secondary', className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
