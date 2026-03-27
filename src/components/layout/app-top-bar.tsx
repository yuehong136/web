import React from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'
import { cn } from '@/lib/utils'
import { InvitationBell } from './InvitationBell'

interface AppTopBarProps extends React.HTMLAttributes<HTMLElement> {
  onOpenSidebar: () => void
  showSidebarToggle?: boolean
  mobileOnly?: boolean
}

export const AppTopBar: React.FC<AppTopBarProps> = ({
  onOpenSidebar,
  showSidebarToggle = true,
  mobileOnly = true,
  className,
  ...props
}) => {
  return (
    <header
      className={cn(
        'z-20 flex items-center justify-between border-b border-components-nav-border bg-components-nav-bg px-space-base py-space-sm',
        mobileOnly && 'lg:hidden',
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-space-sm">
        {showSidebarToggle ? (
          <Button variant="ghost" size="icon" onClick={onOpenSidebar} aria-label="打开导航">
            <Menu className="h-5 w-5" />
          </Button>
        ) : null}
      </div>

      <div className="flex items-center gap-space-xs">
        <InvitationBell />
        <ThemeSwitcher variant="compact" />
      </div>
    </header>
  )
}
