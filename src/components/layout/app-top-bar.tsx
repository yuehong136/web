import { useTranslation } from 'react-i18next'
import type { Ref } from 'react'
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NavigationTooltip } from '@/components/ui/navigation-tooltip'
import { InvitationBell } from '@/components/layout/InvitationBell'
import { cn } from '@/lib/utils'

interface AppTopBarProps {
  onOpenSidebar: () => void
  secondaryCollapsed?: boolean
  onToggleSecondary?: () => void
  secondaryPanelId?: string
  showSidebarToggle?: boolean
  mobileOnly?: boolean
  mobileToggleRef?: Ref<HTMLButtonElement>
}

export const AppTopBar = ({
  onOpenSidebar,
  secondaryCollapsed = false,
  onToggleSecondary = onOpenSidebar,
  secondaryPanelId,
  showSidebarToggle = true,
  mobileOnly = false,
  mobileToggleRef,
}: AppTopBarProps) => {
  const { t } = useTranslation()
  const label = t(
    secondaryCollapsed
      ? 'layout.sidebar.expandSecondary'
      : 'layout.sidebar.collapseSecondary',
  )
  return (
    <header
      className={cn(
        'flex h-10 shrink-0 items-center justify-between border-b border-border-subtle bg-components-nav-bg px-space-sm',
        mobileOnly && 'md:hidden',
      )}
    >
      {showSidebarToggle && (
        <>
          <Button
            ref={mobileToggleRef}
            variant="ghost"
            size="icon-sm"
            onClick={onOpenSidebar}
            aria-label={t('layout.sidebar.openNavigation')}
            className="md:hidden"
          >
            <Menu className="size-icon-sm" />
          </Button>
          <div className="hidden md:block">
            <NavigationTooltip content={label}>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onToggleSecondary}
                aria-label={label}
                aria-expanded={!secondaryCollapsed}
                aria-controls={secondaryPanelId}
              >
                {secondaryCollapsed ? (
                  <PanelLeftOpen className="size-icon-sm" />
                ) : (
                  <PanelLeftClose className="size-icon-sm" />
                )}
              </Button>
            </NavigationTooltip>
          </div>
        </>
      )}
      <InvitationBell />
    </header>
  )
}
