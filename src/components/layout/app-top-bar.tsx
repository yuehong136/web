import { useTranslation } from 'react-i18next'
import type { ReactNode, Ref } from 'react'
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NavigationTooltip } from '@/components/ui/navigation-tooltip'
import { cn } from '@/lib/utils'

interface AppTopBarProps {
  onOpenSidebar: () => void
  secondaryCollapsed?: boolean
  onToggleSecondary?: () => void
  secondaryPanelId?: string
  secondaryAsDialog?: boolean
  secondaryToggleRef?: Ref<HTMLButtonElement>
  showSidebarToggle?: boolean
  showSecondaryToggle?: boolean
  mobileOnly?: boolean
  mobileToggleRef?: Ref<HTMLButtonElement>
  mobilePanelId?: string
  navigationOpen?: boolean
  sectionLabel?: string
  children?: ReactNode
}
export const AppTopBar = ({
  onOpenSidebar,
  secondaryCollapsed = false,
  onToggleSecondary = onOpenSidebar,
  secondaryPanelId,
  secondaryAsDialog,
  secondaryToggleRef,
  showSidebarToggle = true,
  showSecondaryToggle = true,
  mobileOnly = false,
  mobileToggleRef,
  mobilePanelId,
  navigationOpen,
  sectionLabel,
  children,
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
        'flex min-h-[calc(var(--control-height)+var(--space-sm))] shrink-0 items-center gap-space-sm border-b border-border-subtle bg-components-nav-bg px-space-sm py-space-xs',
        mobileOnly && 'md:hidden',
      )}
    >
      {showSidebarToggle && (
        <>
          <Button
            ref={mobileToggleRef}
            variant="ghost"
            size="icon"
            onClick={onOpenSidebar}
            aria-label={t('layout.sidebar.openNavigation')}
            aria-expanded={navigationOpen}
            aria-controls={mobilePanelId}
            aria-haspopup="dialog"
            className="min-h-11 min-w-11 md:hidden"
          >
            <Menu className="size-icon-md" aria-hidden="true" />
          </Button>
          {showSecondaryToggle && (
            <div className="hidden md:block">
              <NavigationTooltip content={label}>
                <Button
                  ref={secondaryToggleRef}
                  variant="ghost"
                  size="icon-sm"
                  onClick={onToggleSecondary}
                  aria-label={label}
                  aria-expanded={!secondaryCollapsed}
                  aria-controls={secondaryPanelId}
                  aria-haspopup={secondaryAsDialog ? 'dialog' : undefined}
                >
                  {secondaryCollapsed ? (
                    <PanelLeftOpen
                      className="size-icon-sm"
                      aria-hidden="true"
                    />
                  ) : (
                    <PanelLeftClose
                      className="size-icon-sm"
                      aria-hidden="true"
                    />
                  )}
                </Button>
              </NavigationTooltip>
            </div>
          )}
        </>
      )}
      <div className="min-w-0 flex-1">
        {children ??
          (sectionLabel && (
            <p className="truncate text-sm font-medium text-text-primary">
              {sectionLabel}
            </p>
          ))}
      </div>
    </header>
  )
}
