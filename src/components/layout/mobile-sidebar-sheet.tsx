import { Link, useLocation } from 'react-router-dom'
import type { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { X, MoreHorizontal } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { primaryNavItems, moreNavItems } from '@/components/layout/Sidebar'
import { SidebarUtilities } from '@/components/layout/sidebar-utilities'
import { SecondaryNavigationContent } from '@/components/patterns/secondary-navigation-content'
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
  const renderLink = (
    item: (typeof primaryNavItems)[number],
    primary = true,
  ) => {
    const Icon = item.icon
    const active = primary
      ? getWorkbenchSection(pathname) === getWorkbenchSection(item.href)
      : pathname === item.href
    return (
      <li key={item.href}>
        <Link
          to={item.href}
          onClick={() => onOpenChange(false)}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'flex min-h-11 items-center gap-space-sm rounded-radius-md px-space-sm py-space-xs text-sm outline-hidden focus-visible:ring-2 focus-visible:ring-state-focus',
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
  }
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
        <header className="flex min-h-14 shrink-0 items-center justify-between gap-space-sm border-b border-border-subtle px-space-base py-space-xs">
          <SheetTitle className="text-sm font-semibold">
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
        <div
          data-navigation-scroll
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          <nav
            aria-label={t('layout.sidebar.primaryNavigation')}
            className="p-space-sm"
          >
            <ul className="flex flex-col gap-space-2xs">
              {primaryNavItems.map((item) => renderLink(item))}
            </ul>
            <details>
              <summary className="flex min-h-11 cursor-pointer items-center gap-space-sm rounded-radius-md px-space-sm text-sm text-text-secondary outline-hidden focus-visible:ring-2 focus-visible:ring-state-focus">
                <MoreHorizontal className="size-icon-sm" aria-hidden="true" />
                {t('layout.sidebar.more')}
              </summary>
              <ul className="flex flex-col gap-space-2xs">
                {moreNavItems.map((item) => renderLink(item, false))}
              </ul>
            </details>
          </nav>
          <div className="flex flex-col border-t border-border-subtle">
            <SecondaryNavigationContent
              touchTargets
              scroll="parent"
              {...navigation}
              currentPath={pathname}
              onNavigate={() => onOpenChange(false)}
            >
              {navigation.content}
            </SecondaryNavigationContent>
          </div>
        </div>
        <footer className="shrink-0 border-t border-border-subtle p-space-sm">
          <SidebarUtilities />
        </footer>
      </SheetContent>
    </Sheet>
  )
}
