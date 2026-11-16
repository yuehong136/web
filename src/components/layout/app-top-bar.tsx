import { useTranslation } from 'react-i18next'
import type { ReactNode, Ref } from 'react'
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
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
  /** Portal target for a page template's title row (see workbench-header). */
  titleRef?: Ref<HTMLDivElement>
  /** Portal target for actions a template places at the header's end. */
  actionsRef?: Ref<HTMLDivElement>
  /** A template's title replaces the route header and section label. */
  titleClaimed?: boolean
  actionsClaimed?: boolean
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
  titleRef,
  actionsRef,
  titleClaimed = false,
  actionsClaimed = false,
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
        'flex min-h-[var(--workbench-header-height)] shrink-0 items-center gap-space-sm bg-components-nav-bg px-space-sm py-space-xs',
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
              <Tooltip
                content={label}
                side="right"
                sideOffset={12}
                delayDuration={100}
                asChild
                portal
              >
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
              </Tooltip>
            </div>
          )}
        </>
      )}
      {!titleClaimed && (
        <div className="min-w-0 flex-1 md:pl-space-xs">
          {children ??
            (sectionLabel && (
              <p className="truncate text-base font-semibold tracking-tight text-text-primary">
                {sectionLabel}
              </p>
            ))}
        </div>
      )}
      <div
        ref={titleRef}
        data-workbench-title
        className={cn(
          'min-w-0 md:pl-space-xs',
          titleClaimed ? 'flex flex-1' : 'hidden',
        )}
      />
      <div
        ref={actionsRef}
        data-workbench-actions
        className={cn(
          'shrink-0 items-center gap-space-sm',
          actionsClaimed ? 'flex' : 'hidden',
        )}
      />
    </header>
  )
}
