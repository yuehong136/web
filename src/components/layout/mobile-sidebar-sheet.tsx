import { useLocation } from 'react-router-dom'
import type { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
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
import type { SecondaryNavigation } from '@/components/layout/workbench-navigation'

interface MobileSidebarSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  navigation: SecondaryNavigation
  returnFocusRef?: RefObject<HTMLElement | null>
}

export const MobileSidebarSheet = ({
  open,
  onOpenChange,
  navigation,
  returnFocusRef,
}: MobileSidebarSheetProps) => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const renderLink = (item: (typeof primaryNavItems)[number]) => {
    const Icon = item.icon
    return (
      <li key={item.href}>
        <Link
          to={item.href}
          onClick={() => onOpenChange(false)}
          className="flex min-h-[44px] items-center gap-space-sm rounded-radius-md px-space-sm text-sm text-text-secondary hover:bg-state-hover focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:outline-hidden"
        >
          <Icon className="size-icon-sm" />
          {t(item.titleKey)}
        </Link>
      </li>
    )
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          returnFocusRef?.current?.focus()
        }}
        side="left"
        showCloseButton={false}
        aria-describedby={undefined}
        className="flex w-[288px] max-w-[calc(100%-2rem)] flex-col gap-0 border-border-subtle bg-components-sidebar-bg p-0"
      >
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border-subtle px-space-base">
          <SheetTitle className="text-sm font-medium">
            {t('layout.sidebar.primaryNavigation')}
          </SheetTitle>
          <SheetClose asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t('common.close')}
            >
              <X className="size-icon-sm" />
            </Button>
          </SheetClose>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <nav
            aria-label={t('layout.sidebar.primaryNavigation')}
            className="p-space-sm"
          >
            <ul>{primaryNavItems.map(renderLink)}</ul>
            <details>
              <summary className="flex min-h-[44px] cursor-pointer items-center gap-space-sm rounded-radius-md px-space-sm text-sm text-text-secondary">
                <MoreHorizontal className="size-icon-sm" />
                {t('layout.sidebar.more')}
              </summary>
              <ul>{moreNavItems.map(renderLink)}</ul>
            </details>
          </nav>
          <div className="border-t border-border-subtle">
            <SecondaryNavigationContent
              touchTargets
              {...navigation}
              currentPath={pathname}
              onNavigate={() => onOpenChange(false)}
            >
              {navigation.content}
            </SecondaryNavigationContent>
          </div>
        </div>
        <footer className="border-t border-border-subtle p-space-sm">
          <SidebarUtilities />
        </footer>
      </SheetContent>
    </Sheet>
  )
}
