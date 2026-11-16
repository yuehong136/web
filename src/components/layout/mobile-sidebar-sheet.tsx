import { Link, useLocation } from 'react-router-dom'
import type { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Settings, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { primaryNavItems, moreNavItems } from '@/components/layout/Sidebar'
import { SidebarUtilities } from '@/components/layout/sidebar-utilities'
import { BrandMark } from '@/components/layout/brand-mark'
import { SecondaryNavigationContent } from '@/components/patterns/secondary-navigation-content'
import { WorkbenchQuickActions } from '@/components/layout/workbench-quick-actions'
import {
  getWorkbenchSection,
  type SecondaryNavigation,
} from '@/components/layout/workbench-navigation'
import { cn } from '@/lib/utils'

interface MobileSidebarSheetProps {
  id?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  navigation: SecondaryNavigation
  returnFocusRef?: RefObject<HTMLElement | null>
  fallbackFocusRef?: RefObject<HTMLElement | null>
  viewportHeight?: number
}

/**
 * Phone navigation (Mobile-nav board): brand and close, the four sections as
 * one segmented row, "More" destinations, the panel-top actions, the current
 * section's navigation, and the account at the bottom. Every target is 44px.
 */
export const MobileSidebarSheet = ({
  id,
  open,
  onOpenChange,
  navigation,
  returnFocusRef,
  viewportHeight,
  fallbackFocusRef,
}: MobileSidebarSheetProps) => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const section = getWorkbenchSection(pathname)
  const moreActive = moreNavItems.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  )
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        id={id}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          const trigger = returnFocusRef?.current
          trigger?.focus()
          if (!trigger || document.activeElement !== trigger)
            fallbackFocusRef?.current?.focus()
        }}
        side="left"
        showCloseButton={false}
        aria-describedby={undefined}
        style={
          viewportHeight && viewportHeight > 0
            ? { height: viewportHeight }
            : undefined
        }
        className="flex w-80 max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden border-border-subtle bg-components-sidebar-bg p-0"
      >
        <header className="flex min-h-14 shrink-0 items-center gap-space-sm py-space-xs pr-space-xs pl-space-base">
          <BrandMark className="flex-1" />
          <SheetTitle className="sr-only">
            {t('layout.sidebar.primaryNavigation')}
          </SheetTitle>
          <SheetClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="min-h-11 min-w-11"
              aria-label={t('common.close')}
            >
              <X className="size-icon-sm" aria-hidden="true" />
            </Button>
          </SheetClose>
        </header>
        <nav
          aria-label={t('layout.sidebar.primaryNavigation')}
          className="shrink-0 px-space-sm"
        >
          <ul className="grid grid-cols-4 gap-space-2xs rounded-radius-md bg-background-subtle p-space-2xs">
            {primaryNavItems.map((item) => {
              const active = section === getWorkbenchSection(item.href)
              return (
                <li key={item.href} className="min-w-0">
                  <Link
                    to={item.href}
                    onClick={() => onOpenChange(false)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-11 items-center justify-center rounded-radius-sm px-space-xs text-sm outline-hidden focus-visible:ring-2 focus-visible:ring-state-focus',
                      active
                        ? 'bg-background-surface font-medium text-text-primary ring-1 ring-border-default'
                        : 'text-text-secondary hover:text-text-primary',
                    )}
                  >
                    <span className="truncate">{t(item.titleKey)}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
          <details className="group mt-space-2xs" open={moreActive}>
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-space-sm rounded-radius-md px-space-sm text-sm text-text-secondary outline-hidden hover:bg-state-hover hover:text-text-primary focus-visible:ring-2 focus-visible:ring-state-focus [&::-webkit-details-marker]:hidden">
              <span className="flex-1">{t('layout.sidebar.more')}</span>
              <ChevronDown
                className="size-icon-sm transition-transform group-open:rotate-180 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </summary>
            <ul className="flex flex-col gap-space-2xs pb-space-xs">
              {moreNavItems.map((item) => {
                const Icon = item.icon
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={() => onOpenChange(false)}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex min-h-11 items-center gap-space-sm rounded-radius-md px-space-sm text-sm outline-hidden focus-visible:ring-2 focus-visible:ring-state-focus',
                        active
                          ? 'bg-state-selected-bg font-medium text-state-selected-text'
                          : 'text-text-secondary hover:bg-state-hover hover:text-text-primary',
                      )}
                    >
                      <Icon className="size-icon-sm" aria-hidden="true" />
                      {t(item.titleKey)}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </details>
        </nav>
        <div
          data-navigation-scroll
          className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain [&_[data-nav-row]]:min-h-11"
        >
          <SecondaryNavigationContent
            touchTargets
            scroll="parent"
            {...navigation}
            currentPath={pathname}
            onNavigate={() => onOpenChange(false)}
            quickActions={
              <WorkbenchQuickActions
                newConversation={navigation.section === 'home'}
                touch
              />
            }
          >
            {navigation.content}
          </SecondaryNavigationContent>
        </div>
        <footer className="flex shrink-0 items-center gap-space-xs border-t border-border-subtle p-space-sm [&_button]:min-h-11">
          <div className="min-w-0 flex-1">
            <SidebarUtilities />
          </div>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11"
          >
            <Link
              to="/settings"
              state={{
                returnTo: pathname.startsWith('/settings') ? '/home' : pathname,
              }}
              onClick={() => onOpenChange(false)}
              aria-label={t('layout.sidebar.settings')}
              aria-current={section === 'settings' ? 'page' : undefined}
            >
              <Settings className="size-icon-sm" aria-hidden="true" />
            </Link>
          </Button>
        </footer>
      </SheetContent>
    </Sheet>
  )
}
