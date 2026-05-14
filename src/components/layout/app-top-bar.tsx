import React from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

  return (
    <header
      className={cn(
        'px-space-base py-space-sm z-20 flex items-center justify-between border-b border-components-nav-border bg-components-nav-bg',
        mobileOnly && 'lg:hidden',
        className,
      )}
      {...props}
    >
      <div className="gap-space-sm flex items-center">
        {showSidebarToggle ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSidebar}
            aria-label={t('layout.sidebar.openNavigation', '打开导航')}
          >
            <Menu className="h-5 w-5" />
          </Button>
        ) : null}
      </div>

      <div className="gap-space-xs flex items-center">
        <InvitationBell />
        <ThemeSwitcher variant="compact" />
      </div>
    </header>
  )
}
