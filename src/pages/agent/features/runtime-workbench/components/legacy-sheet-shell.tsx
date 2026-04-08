import type { ReactNode } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface LegacySheetShellProps {
  open?: boolean
  title: string
  description: string
  onOpenChange?: (open: boolean) => void
  children: ReactNode
  className?: string
}

export function LegacySheetShell({
  open = true,
  title,
  description,
  onOpenChange,
  children,
  className,
}: LegacySheetShellProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent className={cn('top-20 p-0', className)}>
        <SheetHeader className="border-b border-border-primary px-space-md py-space-sm">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <section className="min-h-0 flex-1 overflow-auto">{children}</section>
      </SheetContent>
    </Sheet>
  )
}
