import React from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Sidebar } from './Sidebar'

interface MobileSidebarSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const MobileSidebarSheet: React.FC<MobileSidebarSheetProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[288px] max-w-none border-components-app-shell-border bg-components-app-shell-surface p-0 sm:max-w-none"
      >
        <Sidebar allowCollapse={false} className="h-full w-full rounded-none" />
      </SheetContent>
    </Sheet>
  )
}
